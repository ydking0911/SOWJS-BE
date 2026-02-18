/**
 * 내전 팀 밸런싱 서비스 (Service Layer)
 * 10명의 플레이어 데이터를 받아 최적의 팀 구성을 계산합니다.
 * 실제 MMR 산출은 AI 엔진(Python FastAPI)에 위임합니다.
 */
import axios from 'axios';
import { config } from '@config/index';
import { getSummonerProfile, tierToNumber } from './summoner.service';
import {
    PlayerInput,
    BalanceResult,
    TeamPlayer,
    Position,
} from '@models/summoner.model';

/**
 * AI 엔진 응답 타입
 */
interface AiEngineBalanceResponse {
    results: Array<{
        rank: number;
        teamA: Array<{ summonerName: string; assignedPosition: string; hiddenMmr: number }>;
        teamB: Array<{ summonerName: string; assignedPosition: string; hiddenMmr: number }>;
        teamAWinRate: number;
        teamBWinRate: number;
        balanceScore: number;
    }>;
}

/**
 * 10명의 플레이어를 입력받아 최적 팀 구성 Top 3를 반환합니다.
 *
 * 처리 흐름:
 * 1. 각 소환사의 프로필 및 통계 데이터 수집 (병렬)
 * 2. AI 엔진에 데이터 전송 → 팀 밸런싱 결과 수신
 * 3. 결과 포맷팅 후 반환
 *
 * @param players - 10명의 플레이어 입력 (소환사명 + 포지션)
 * @returns 팀 밸런싱 결과 Top 3
 */
export async function balanceTeams(players: PlayerInput[]): Promise<BalanceResult[]> {
    if (players.length < 2 || players.length > 10) {
        throw new Error('플레이어 수는 2명 이상 10명 이하여야 합니다.');
    }

    // 1. 모든 소환사 프로필 병렬 조회
    const profiles = await Promise.all(
        players.map((p) => getSummonerProfile(p.summonerName)),
    );

    // 2. AI 엔진에 전달할 페이로드 구성
    const payload = players.map((player, idx) => {
        const profile = profiles[idx];
        const stats = profile.stats;

        return {
            summonerName: player.summonerName,
            primaryPosition: player.primaryPosition,
            secondaryPosition: player.secondaryPosition,
            // 티어 수치 (AI 엔진의 히든 MMR 산출 입력값)
            tierScore: tierToNumber(profile.tier ?? 'IRON', profile.rank ?? 'IV'),
            winRate: profile.winRate,
            avgKda: stats?.avgKda ?? 0,
            avgCsPerMin: stats?.avgCsPerMin ?? 0,
            avgVisionScore: stats?.avgVisionScore ?? 0,
            objectiveParticipation: stats?.objectiveParticipation ?? 0,
        };
    });

    // 3. AI 엔진 호출 (Python FastAPI)
    let aiResponse: AiEngineBalanceResponse;
    try {
        const { data } = await axios.post<AiEngineBalanceResponse>(
            `${config.aiEngine.baseUrl}/team/balance`,
            { players: payload },
            { timeout: config.aiEngine.timeout },
        );
        aiResponse = data;
    } catch {
        // AI 엔진 장애 시 폴백: 단순 MMR 합산 방식으로 팀 구성
        return fallbackBalance(players, profiles);
    }

    // 4. 결과 포맷팅
    return aiResponse.results.map((result) => ({
        rank: result.rank,
        teamA: result.teamA.map((p) => ({
            summonerName: p.summonerName,
            assignedPosition: p.assignedPosition as Position,
            hiddenMmr: p.hiddenMmr,
            tier: profiles.find((pr) => pr.summonerName === p.summonerName)?.tier ?? 'UNRANKED',
            rank: profiles.find((pr) => pr.summonerName === p.summonerName)?.rank ?? '',
        })),
        teamB: result.teamB.map((p) => ({
            summonerName: p.summonerName,
            assignedPosition: p.assignedPosition as Position,
            hiddenMmr: p.hiddenMmr,
            tier: profiles.find((pr) => pr.summonerName === p.summonerName)?.tier ?? 'UNRANKED',
            rank: profiles.find((pr) => pr.summonerName === p.summonerName)?.rank ?? '',
        })),
        teamAWinRate: result.teamAWinRate,
        teamBWinRate: result.teamBWinRate,
        balanceScore: result.balanceScore,
    }));
}

/**
 * AI 엔진 장애 시 폴백 팀 구성 (단순 티어 합산 방식)
 * 플레이어를 티어 점수 기준으로 정렬 후 교대 배치합니다.
 */
function fallbackBalance(
    players: PlayerInput[],
    profiles: Awaited<ReturnType<typeof getSummonerProfile>>[],
): BalanceResult[] {
    // 티어 점수 기준 내림차순 정렬
    const sorted = players
        .map((p, i) => ({
            player: p,
            profile: profiles[i],
            score: tierToNumber(profiles[i].tier ?? 'IRON', profiles[i].rank ?? 'IV'),
        }))
        .sort((a, b) => b.score - a.score);

    // 교대 배치 (뱀 드래프트 방식)
    const teamA: typeof sorted = [];
    const teamB: typeof sorted = [];
    sorted.forEach((item, idx) => {
        if (idx % 2 === 0) teamA.push(item);
        else teamB.push(item);
    });

    const teamAScore = teamA.reduce((s, i) => s + i.score, 0);
    const teamBScore = teamB.reduce((s, i) => s + i.score, 0);
    const total = teamAScore + teamBScore;

    const toTeamPlayer = (item: (typeof sorted)[0], pos: Position): TeamPlayer => ({
        summonerName: item.player.summonerName,
        assignedPosition: pos,
        hiddenMmr: item.score,
        tier: item.profile.tier ?? 'UNRANKED',
        rank: item.profile.rank ?? '',
    });

    return [
        {
            rank: 1,
            teamA: teamA.map((item) => toTeamPlayer(item, item.player.primaryPosition)),
            teamB: teamB.map((item) => toTeamPlayer(item, item.player.primaryPosition)),
            teamAWinRate: total > 0 ? teamAScore / total : 0.5,
            teamBWinRate: total > 0 ? teamBScore / total : 0.5,
            balanceScore: Math.abs(teamAScore - teamBScore),
        },
    ];
}

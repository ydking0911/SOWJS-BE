/**
 * 소환사 서비스 (Service Layer)
 * 비즈니스 로직을 담당합니다.
 * - Riot API 데이터 수집
 * - Redis 캐싱
 * - 히든 MMR 산출을 위한 통계 집계
 */
import { config } from '@config/index';
import { getCache, setCache } from '@utils/cache';
import {
    getSummonerByName,
    getLeagueEntries,
    getMatchIds,
    getMatchParticipant,
} from '@utils/riotClient';
import {
    SummonerProfile,
    SummonerStats,
    Position,
    Tier,
    RiotLeagueEntryDto,
} from '@models/summoner.model';

/**
 * 소환사명으로 전체 프로필(기본 정보 + 랭크 + 통계)을 조회합니다.
 * Redis 캐시를 우선 확인하고, 캐시 미스 시 Riot API를 호출합니다.
 *
 * @param summonerName - 소환사명
 * @returns 소환사 프로필
 * @throws RiotApiError - 소환사를 찾을 수 없거나 API 오류 발생 시
 */
export async function getSummonerProfile(summonerName: string): Promise<SummonerProfile> {
    const cacheKey = `summoner:${summonerName.toLowerCase()}:profile`;

    // 1. 캐시 확인
    const cached = await getCache<SummonerProfile>(cacheKey);
    if (cached) return cached;

    // 2. Riot API - 소환사 기본 정보 조회
    const summoner = await getSummonerByName(summonerName);

    // 3. Riot API - 랭크 정보 조회
    const leagueEntries = await getLeagueEntries(summoner.id);
    const soloRank = leagueEntries.find((e) => e.queueType === 'RANKED_SOLO_5x5') ?? null;

    // 4. 통계 데이터 조회 (히든 MMR 산출용)
    const stats = await getSummonerStats(summoner.puuid, soloRank);

    // 5. 프로필 조합
    const profile: SummonerProfile = {
        puuid: summoner.puuid,
        summonerName: summoner.name,
        summonerLevel: summoner.summonerLevel,
        profileIconId: summoner.profileIconId,
        tier: soloRank?.tier ?? null,
        rank: soloRank?.rank ?? null,
        lp: soloRank?.leaguePoints ?? 0,
        wins: soloRank?.wins ?? 0,
        losses: soloRank?.losses ?? 0,
        winRate: soloRank ? soloRank.wins / (soloRank.wins + soloRank.losses) : 0,
        stats,
    };

    // 6. 캐시 저장 (1시간)
    await setCache(cacheKey, profile, config.redis.ttl.summoner);

    return profile;
}

/**
 * PUUID 기반으로 최근 게임 통계를 집계합니다.
 * 히든 MMR 산출에 필요한 KDA, CS, 시야, 오브젝트 기여도를 계산합니다.
 *
 * @param puuid - 플레이어 고유 UUID
 * @param soloRank - 솔로랭크 정보 (없으면 null)
 * @returns 집계된 통계 또는 null (게임 기록 없음)
 */
export async function getSummonerStats(
    puuid: string,
    soloRank: RiotLeagueEntryDto | null,
): Promise<SummonerStats | null> {
    const cacheKey = `summoner:${puuid}:stats`;

    // 캐시 확인
    const cached = await getCache<SummonerStats>(cacheKey);
    if (cached) return cached;

    // 최근 20게임 매치 ID 조회 (솔로랭크 큐: 420)
    const matchIds = await getMatchIds(puuid, 20, 420);
    if (matchIds.length === 0) return null;

    // 각 매치 상세 데이터 병렬 조회
    const participants = await Promise.all(
        matchIds.map((id) => getMatchParticipant(id, puuid)),
    );
    const validParticipants = participants.filter(Boolean);
    if (validParticipants.length === 0) return null;

    // ===========================
    // 통계 집계
    // ===========================
    const totalGames = validParticipants.length;

    // 평균 KDA
    const totalKda = validParticipants.reduce((sum, p) => {
        const deaths = p!.deaths === 0 ? 1 : p!.deaths; // 데스 0 방지
        return sum + (p!.kills + p!.assists) / deaths;
    }, 0);

    // 분당 평균 CS (정글러는 중립 몬스터 포함)
    const totalCsPerMin = validParticipants.reduce((sum, p) => {
        const totalCs = p!.totalMinionsKilled + p!.neutralMinionsKilled;
        const minutes = p!.gameDuration / 60;
        return sum + totalCs / minutes;
    }, 0);

    // 평균 시야 점수
    const totalVision = validParticipants.reduce((sum, p) => sum + p!.visionScore, 0);

    // 오브젝트 참여율 (드래곤 또는 바론 킬이 있는 게임 비율)
    const objectiveGames = validParticipants.filter(
        (p) => p!.dragonKills > 0 || p!.baronKills > 0,
    ).length;

    // 주 포지션 결정 (가장 많이 플레이한 포지션)
    const positionCount: Record<string, number> = {};
    validParticipants.forEach((p) => {
        positionCount[p!.teamPosition] = (positionCount[p!.teamPosition] ?? 0) + 1;
    });
    const primaryPositionRaw = Object.entries(positionCount).sort((a, b) => b[1] - a[1])[0]?.[0];
    const primaryPosition = mapRiotPositionToEnum(primaryPositionRaw ?? '');

    const stats: SummonerStats = {
        puuid,
        summonerName: validParticipants[0]!.summonerName,
        tier: soloRank?.tier ?? 'UNRANKED',
        rank: soloRank?.rank ?? '',
        lp: soloRank?.leaguePoints ?? 0,
        wins: soloRank?.wins ?? 0,
        losses: soloRank?.losses ?? 0,
        winRate: soloRank ? soloRank.wins / (soloRank.wins + soloRank.losses) : 0,
        avgKda: totalKda / totalGames,
        avgCsPerMin: totalCsPerMin / totalGames,
        avgVisionScore: totalVision / totalGames,
        objectiveParticipation: objectiveGames / totalGames,
        primaryPosition,
        recentGamesAnalyzed: totalGames,
    };

    // 캐시 저장 (1시간)
    await setCache(cacheKey, stats, config.redis.ttl.stats);

    return stats;
}

/**
 * 티어 문자열을 수치로 변환합니다. (히든 MMR 계산용)
 * @param tier - 티어 문자열 (예: 'GOLD')
 * @param rank - 랭크 문자열 (예: 'I', 'II', 'III', 'IV')
 * @returns 티어 수치 (1~10 기본값, 랭크 보정 포함)
 */
export function tierToNumber(tier: string, rank: string): number {
    const tierValue = Tier[tier as keyof typeof Tier] ?? 0;
    // 랭크 보정: I=0.75, II=0.5, III=0.25, IV=0
    const rankBonus: Record<string, number> = { I: 0.75, II: 0.5, III: 0.25, IV: 0 };
    return tierValue + (rankBonus[rank] ?? 0);
}

/**
 * Riot API 포지션 문자열을 내부 Position 열거형으로 변환합니다.
 */
function mapRiotPositionToEnum(riotPosition: string): Position {
    const map: Record<string, Position> = {
        TOP: Position.TOP,
        JUNGLE: Position.JUNGLE,
        MIDDLE: Position.MID,
        BOTTOM: Position.ADC,
        UTILITY: Position.SUPPORT,
    };
    return map[riotPosition] ?? Position.FILL;
}

/**
 * 소환사 관련 타입 및 인터페이스 정의 (Model Layer)
 * Riot API 응답 구조와 내부 데이터 모델을 정의합니다.
 */

// ===========================
// Riot API 응답 타입
// ===========================

/**
 * Riot API - 소환사 기본 정보 응답
 * GET /lol/summoner/v4/summoners/by-name/{summonerName}
 */
export interface RiotSummonerDto {
    id: string;           // 암호화된 소환사 ID (리그 정보 조회용)
    accountId: string;    // 암호화된 계정 ID
    puuid: string;        // 플레이어 고유 UUID (매치 조회용)
    name: string;         // 소환사명
    profileIconId: number; // 프로필 아이콘 ID
    revisionDate: number; // 마지막 수정 타임스탬프
    summonerLevel: number; // 소환사 레벨
}

/**
 * Riot API - 리그(랭크) 정보 응답
 * GET /lol/league/v4/entries/by-summoner/{encryptedSummonerId}
 */
export interface RiotLeagueEntryDto {
    leagueId: string;
    summonerId: string;
    summonerName: string;
    queueType: string;       // 'RANKED_SOLO_5x5' | 'RANKED_FLEX_SR'
    tier: string;            // 'IRON' | 'BRONZE' | ... | 'CHALLENGER'
    rank: string;            // 'I' | 'II' | 'III' | 'IV'
    leaguePoints: number;    // LP
    wins: number;
    losses: number;
    hotStreak: boolean;
    veteran: boolean;
    freshBlood: boolean;
    inactive: boolean;
}

/**
 * Riot API - 매치 상세 참가자 정보
 */
export interface RiotMatchParticipantDto {
    puuid: string;
    summonerName: string;
    championName: string;
    teamPosition: string;    // 'TOP' | 'JUNGLE' | 'MIDDLE' | 'BOTTOM' | 'UTILITY'
    kills: number;
    deaths: number;
    assists: number;
    totalMinionsKilled: number;
    neutralMinionsKilled: number;
    visionScore: number;
    win: boolean;
    gameDuration: number;    // 게임 시간 (초)
    dragonKills: number;
    baronKills: number;
}

// ===========================
// 내부 도메인 모델
// ===========================

/**
 * 티어 열거형 (수치 변환용)
 */
export enum Tier {
    IRON = 1,
    BRONZE = 2,
    SILVER = 3,
    GOLD = 4,
    PLATINUM = 5,
    EMERALD = 6,
    DIAMOND = 7,
    MASTER = 8,
    GRANDMASTER = 9,
    CHALLENGER = 10,
}

/**
 * 포지션 열거형
 */
export enum Position {
    TOP = 'TOP',
    JUNGLE = 'JUNGLE',
    MID = 'MID',
    ADC = 'ADC',
    SUPPORT = 'SUPPORT',
    FILL = 'FILL', // 상관없음
}

/**
 * 소환사 통계 (히든 MMR 산출용)
 */
export interface SummonerStats {
    puuid: string;
    summonerName: string;
    tier: string;
    rank: string;
    lp: number;
    wins: number;
    losses: number;
    winRate: number;         // 승률 (0~1)
    avgKda: number;          // 평균 KDA
    avgCsPerMin: number;     // 분당 평균 CS
    avgVisionScore: number;  // 평균 시야 점수
    objectiveParticipation: number; // 오브젝트 참여율 (0~1)
    primaryPosition: Position;
    recentGamesAnalyzed: number; // 분석한 게임 수
}

/**
 * 소환사 전적 요약 (API 응답용)
 */
export interface SummonerProfile {
    puuid: string;
    summonerName: string;
    summonerLevel: number;
    profileIconId: number;
    tier: string | null;
    rank: string | null;
    lp: number;
    wins: number;
    losses: number;
    winRate: number;
    stats: SummonerStats | null;
}

/**
 * 팀 구성 요청 - 개별 플레이어 입력
 */
export interface PlayerInput {
    summonerName: string;
    primaryPosition: Position;
    secondaryPosition: Position;
}

/**
 * 팀 구성 결과 - 개별 플레이어
 */
export interface TeamPlayer {
    summonerName: string;
    assignedPosition: Position;
    hiddenMmr: number;
    tier: string;
    rank: string;
}

/**
 * 팀 밸런싱 결과
 */
export interface BalanceResult {
    rank: number;              // 추천 순위 (1~3)
    teamA: TeamPlayer[];
    teamB: TeamPlayer[];
    teamAWinRate: number;      // 팀 A 예상 승률 (0~1)
    teamBWinRate: number;      // 팀 B 예상 승률 (0~1)
    balanceScore: number;      // 밸런스 점수 (낮을수록 균형)
}

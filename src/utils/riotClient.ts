/**
 * Riot API 클라이언트 유틸리티
 * Riot Games API와의 HTTP 통신을 담당합니다.
 * Rate Limit 처리 및 에러 핸들링을 포함합니다.
 */
import axios, { AxiosInstance, AxiosError } from 'axios';
import { config } from '@config/index';
import { RiotSummonerDto, RiotLeagueEntryDto, RiotMatchParticipantDto } from '@models/summoner.model';

/**
 * Riot API 에러 클래스
 */
export class RiotApiError extends Error {
    constructor(
        public readonly statusCode: number,
        message: string,
    ) {
        super(message);
        this.name = 'RiotApiError';
    }
}

/**
 * Riot API HTTP 클라이언트 (KR 서버)
 */
const riotKrClient: AxiosInstance = axios.create({
    baseURL: config.riot.baseUrl,
    headers: {
        'X-Riot-Token': config.riot.apiKey,
        'Content-Type': 'application/json',
    },
    timeout: 10000, // 10초
});

/**
 * Riot API HTTP 클라이언트 (Asia 서버 - 매치 v5용)
 */
const riotAsiaClient: AxiosInstance = axios.create({
    baseURL: config.riot.asiaUrl,
    headers: {
        'X-Riot-Token': config.riot.apiKey,
        'Content-Type': 'application/json',
    },
    timeout: 10000,
});

/**
 * Axios 에러를 RiotApiError로 변환하는 인터셉터
 */
function addErrorInterceptor(client: AxiosInstance): void {
    client.interceptors.response.use(
        (response) => response,
        (error: AxiosError) => {
            const status = error.response?.status ?? 500;
            const messages: Record<number, string> = {
                400: '잘못된 요청입니다.',
                401: 'Riot API 키가 유효하지 않습니다.',
                403: 'Riot API 접근이 거부되었습니다.',
                404: '소환사를 찾을 수 없습니다.',
                429: 'Riot API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
                500: 'Riot API 서버 오류입니다.',
            };
            throw new RiotApiError(status, messages[status] ?? '알 수 없는 오류가 발생했습니다.');
        },
    );
}

addErrorInterceptor(riotKrClient);
addErrorInterceptor(riotAsiaClient);

// ===========================
// Riot API 함수들
// ===========================

/**
 * 소환사명으로 소환사 기본 정보를 조회합니다.
 * @param summonerName - 소환사명
 */
export async function getSummonerByName(summonerName: string): Promise<RiotSummonerDto> {
    const encoded = encodeURIComponent(summonerName);
    const { data } = await riotKrClient.get<RiotSummonerDto>(
        `/lol/summoner/v4/summoners/by-name/${encoded}`,
    );
    return data;
}

/**
 * 소환사 ID로 랭크 정보를 조회합니다.
 * @param encryptedSummonerId - 암호화된 소환사 ID
 */
export async function getLeagueEntries(encryptedSummonerId: string): Promise<RiotLeagueEntryDto[]> {
    const { data } = await riotKrClient.get<RiotLeagueEntryDto[]>(
        `/lol/league/v4/entries/by-summoner/${encryptedSummonerId}`,
    );
    return data;
}

/**
 * PUUID로 최근 매치 ID 목록을 조회합니다.
 * @param puuid - 플레이어 고유 UUID
 * @param count - 조회할 게임 수 (기본 20, 최대 100)
 * @param queueId - 큐 타입 (420: 솔로랭크, 440: 자유랭크, 빈값: 전체)
 */
export async function getMatchIds(
    puuid: string,
    count: number = 20,
    queueId?: number,
): Promise<string[]> {
    const params: Record<string, string | number> = { count };
    if (queueId) params['queue'] = queueId;

    const { data } = await riotAsiaClient.get<string[]>(
        `/lol/match/v5/matches/by-puuid/${puuid}/ids`,
        { params },
    );
    return data;
}

/**
 * 매치 ID로 매치 상세 정보에서 특정 플레이어의 데이터를 조회합니다.
 * @param matchId - 매치 ID
 * @param puuid - 조회할 플레이어의 PUUID
 */
export async function getMatchParticipant(
    matchId: string,
    puuid: string,
): Promise<RiotMatchParticipantDto | null> {
    const { data } = await riotAsiaClient.get<{
        info: { participants: RiotMatchParticipantDto[]; gameDuration: number };
    }>(`/lol/match/v5/matches/${matchId}`);

    const participant = data.info.participants.find((p) => p.puuid === puuid);
    if (!participant) return null;

    // gameDuration을 participant에 주입
    return { ...participant, gameDuration: data.info.gameDuration };
}

/**
 * 소환사 서비스 단위 테스트
 * 비즈니스 로직(tierToNumber, 통계 집계)을 검증합니다.
 * 외부 의존성(Riot API, Redis)은 모킹합니다.
 */
import { tierToNumber } from '../src/services/summoner.service';

// Redis 클라이언트 모킹 (실제 연결 없이 테스트)
jest.mock('../src/utils/cache', () => ({
    getCache: jest.fn().mockResolvedValue(null),
    setCache: jest.fn().mockResolvedValue(undefined),
}));

// Riot API 클라이언트 모킹
jest.mock('../src/utils/riotClient', () => ({
    getSummonerByName: jest.fn(),
    getLeagueEntries: jest.fn(),
    getMatchIds: jest.fn(),
    getMatchParticipant: jest.fn(),
    RiotApiError: class RiotApiError extends Error {
        constructor(public statusCode: number, message: string) {
            super(message);
        }
    },
}));

// ===========================
// tierToNumber 테스트
// ===========================
describe('tierToNumber()', () => {
    it('IRON IV는 1.0을 반환해야 한다', () => {
        expect(tierToNumber('IRON', 'IV')).toBe(1);
    });

    it('GOLD I은 4.75를 반환해야 한다', () => {
        expect(tierToNumber('GOLD', 'I')).toBe(4.75);
    });

    it('CHALLENGER (랭크 없음)는 10을 반환해야 한다', () => {
        expect(tierToNumber('CHALLENGER', 'I')).toBe(10.75);
    });

    it('알 수 없는 티어는 0을 반환해야 한다', () => {
        expect(tierToNumber('UNKNOWN', 'I')).toBe(0.75);
    });

    it('DIAMOND II는 7.5를 반환해야 한다', () => {
        expect(tierToNumber('DIAMOND', 'II')).toBe(7.5);
    });
});

import { getSummonerProfile, getSummonerStats, tierToNumber } from '../src/services/summoner.service';
import { getCache, setCache } from '../src/utils/cache';
import {
    getSummonerByName,
    getLeagueEntries,
    getMatchIds,
    getMatchParticipant,
} from '../src/utils/riotClient';
import { Position } from '../src/models/summoner.model';

// 모킹 설정
jest.mock('../src/utils/cache');
jest.mock('../src/utils/riotClient');

const mockedGetCache = getCache as jest.Mock;
const mockedSetCache = setCache as jest.Mock;
const mockedGetSummonerByName = getSummonerByName as jest.Mock;
const mockedGetLeagueEntries = getLeagueEntries as jest.Mock;
const mockedGetMatchIds = getMatchIds as jest.Mock;
const mockedGetMatchParticipant = getMatchParticipant as jest.Mock;

describe('Summoner Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getSummonerProfile()', () => {
        const mockName = '페이커';
        const mockSummoner = { id: 'id123', puuid: 'puuid123', name: mockName, summonerLevel: 500, profileIconId: 1 };
        const mockLeagueEntries = [{ queueType: 'RANKED_SOLO_5x5', tier: 'CHALLENGER', rank: 'I', wins: 100, losses: 50, leaguePoints: 1000 }];

        it('캐시가 존재하면 캐시 데이터를 반환해야 한다', async () => {
            const mockCachedProfile = { summonerName: mockName };
            mockedGetCache.mockResolvedValue(mockCachedProfile);

            const result = await getSummonerProfile(mockName);

            expect(result).toEqual(mockCachedProfile);
            expect(mockedGetSummonerByName).not.toHaveBeenCalled();
        });

        it('캐시가 없으면 Riot API를 호출하고 결과를 캐싱해야 한다', async () => {
            mockedGetCache.mockResolvedValue(null);
            mockedGetSummonerByName.mockResolvedValue(mockSummoner);
            mockedGetLeagueEntries.mockResolvedValue(mockLeagueEntries);
            mockedGetMatchIds.mockResolvedValue([]); // stats null 방지

            const result = await getSummonerProfile(mockName);

            expect(result.summonerName).toBe(mockName);
            expect(result.tier).toBe('CHALLENGER');
            expect(mockedSetCache).toHaveBeenCalled();
        });
    });

    describe('getSummonerStats()', () => {
        const mockPuuid = 'puuid123';
        const mockParticipant = {
            summonerName: '페이커',
            teamPosition: 'MIDDLE',
            kills: 10,
            deaths: 0,
            assists: 10,
            totalMinionsKilled: 200,
            neutralMinionsKilled: 50,
            visionScore: 30,
            gameDuration: 1800,
            dragonKills: 1,
            baronKills: 0,
        };

        it('매치 기록이 없으면 null을 반환해야 한다', async () => {
            mockedGetMatchIds.mockResolvedValue([]);
            const result = await getSummonerStats(mockPuuid, null);
            expect(result).toBeNull();
        });

        it('유효한 참가자 데이터가 없으면 null을 반환해야 한다', async () => {
            mockedGetMatchIds.mockResolvedValue(['match1']);
            mockedGetMatchParticipant.mockResolvedValue(null);
            const result = await getSummonerStats(mockPuuid, null);
            expect(result).toBeNull();
        });

        it('통계를 정확하게 계산해야 한다', async () => {
            mockedGetMatchIds.mockResolvedValue(['match1']);
            mockedGetMatchParticipant.mockResolvedValue(mockParticipant);

            const result = await getSummonerStats(mockPuuid, null);

            expect(result?.avgKda).toBe(20); // (10+10)/1
            expect(result?.primaryPosition).toBe(Position.MID);
            expect(result?.objectiveParticipation).toBe(1);
        });
    });

    describe('tierToNumber()', () => {
        it('올바른 점수를 계산해야 한다', () => {
            expect(tierToNumber('IRON', 'IV')).toBe(1);
            expect(tierToNumber('GOLD', 'I')).toBe(4.75);
            expect(tierToNumber('UNKNOWN', 'IV')).toBe(0);
        });
    });
});

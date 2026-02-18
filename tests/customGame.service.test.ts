import axios from 'axios';
import { balanceTeams } from '../src/services/customGame.service';
import { getSummonerProfile } from '../src/services/summoner.service';
import { Position } from '../src/models/summoner.model';

// axios 및 summoner.service 모킹
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock('../src/services/summoner.service', () => ({
    getSummonerProfile: jest.fn(),
    tierToNumber: jest.fn((tier: string, rank: string) => {
        const tierValue: Record<string, number> = { IRON: 1, BRONZE: 2, SILVER: 3, GOLD: 4, PLATINUM: 5, DIAMOND: 6, CHALLENGER: 10 };
        const rankBonus: Record<string, number> = { I: 0.75, II: 0.5, III: 0.25, IV: 0 };
        return (tierValue[tier] || 0) + (rankBonus[rank] || 0);
    }),
}));

const mockedGetSummonerProfile = getSummonerProfile as jest.Mock;

describe('CustomGame Service', () => {
    const mockPlayers = Array.from({ length: 10 }, (_, i) => ({
        summonerName: `Player${i + 1}`,
        primaryPosition: Position.TOP,
        secondaryPosition: Position.FILL,
    }));

    const mockProfiles = mockPlayers.map((p) => ({
        summonerName: p.summonerName,
        tier: 'GOLD',
        rank: 'I',
        winRate: 0.5,
        stats: {
            avgKda: 3.0,
            avgCsPerMin: 7.0,
            avgVisionScore: 20,
            objectiveParticipation: 0.5,
        },
    }));

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('플레이어가 2명 미만이면 에러를 던져야 한다', async () => {
        await expect(balanceTeams([mockPlayers[0]])).rejects.toThrow('플레이어 수는 2명 이상 10명 이하여야 합니다.');
    });

    it('플레이어가 10명 초과이면 에러를 던져야 한다', async () => {
        const tooManyPlayers = Array.from({ length: 11 }, (_, i) => ({
            summonerName: `Player${i + 1}`,
            primaryPosition: Position.TOP,
            secondaryPosition: Position.FILL,
        }));
        await expect(balanceTeams(tooManyPlayers)).rejects.toThrow('플레이어 수는 2명 이상 10명 이하여야 합니다.');
    });

    it('AI 엔진 호출 성공 시 결과를 올바르게 변환해야 한다', async () => {
        mockedGetSummonerProfile.mockImplementation((name) => {
            const profile = mockProfiles.find((p) => p.summonerName === name);
            return Promise.resolve(profile);
        });

        const mockAiResponse = {
            data: {
                results: [
                    {
                        rank: 1,
                        teamA: [{ summonerName: 'Player1', assignedPosition: 'TOP', hiddenMmr: 5.5 }],
                        teamB: [{ summonerName: 'Player2', assignedPosition: 'JUNGLE', hiddenMmr: 5.2 }],
                        teamAWinRate: 0.51,
                        teamBWinRate: 0.49,
                        balanceScore: 0.95,
                    },
                ],
            },
        };
        mockedAxios.post.mockResolvedValue(mockAiResponse);

        const result = await balanceTeams(mockPlayers.slice(0, 2));

        expect(result).toHaveLength(1);
        expect(result[0].rank).toBe(1);
        expect(result[0].teamA[0].summonerName).toBe('Player1');
        expect(result[0].teamA[0].tier).toBe('GOLD');
        expect(mockedAxios.post).toHaveBeenCalled();
    });

    it('AI 엔진 호출 실패 시 폴백(fallbackBalance) 로직이 작동해야 한다', async () => {
        mockedGetSummonerProfile.mockImplementation((name) => {
            const profile = mockProfiles.find((p) => p.summonerName === name);
            return Promise.resolve(profile);
        });

        mockedAxios.post.mockRejectedValue(new Error('AI Engine Down'));

        const result = await balanceTeams(mockPlayers.slice(0, 4));

        expect(result).toHaveLength(1);
        expect(result[0].rank).toBe(1);
        // 폴백 로직은 티어 점수 기준 정렬 후 0, 2번 인덱스가 Team A, 1, 3번 인덱스가 Team B
        expect(result[0].teamA).toHaveLength(2);
        expect(result[0].teamB).toHaveLength(2);
        expect(mockedAxios.post).toHaveBeenCalled();
    });

    it('프로필이 없을 경우 기본 티어(UNRANKED)를 사용해야 한다', async () => {
        mockedGetSummonerProfile.mockImplementation((name) => {
            return Promise.resolve({
                summonerName: name,
                tier: undefined,
                rank: undefined,
                winRate: 0,
                stats: null,
            });
        });

        mockedAxios.post.mockRejectedValue(new Error('AI Engine Down'));

        const result = await balanceTeams(mockPlayers.slice(0, 2));
        expect(result[0].teamA[0].tier).toBe('UNRANKED');
    });
});

import { buildApp } from '../src/app';
import { FastifyInstance } from 'fastify';
import { balanceTeams } from '../src/services/customGame.service';
import { getSummonerProfile } from '../src/services/summoner.service';

// 서비스 모킹
jest.mock('../src/services/customGame.service');
jest.mock('../src/services/summoner.service');

const mockedBalanceTeams = balanceTeams as jest.Mock;
const mockedGetSummonerProfile = getSummonerProfile as jest.Mock;

describe('API Controllers Integration', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
        process.env.RIOT_API_KEY = 'test-key';
        app = await buildApp();
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('POST /api/custom-game/balance', () => {
        it('유효하지 않은 플레이어 수 요청 시 400을 반환해야 한다', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/custom-game/balance',
                payload: { players: [] },
            });
            expect(response.statusCode).toBe(400);
        });

        it('유효하지 않은 포지션 요청 시 400을 반환해야 한다', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/custom-game/balance',
                payload: {
                    players: [{ summonerName: 'P1', primaryPosition: 'INVALID', secondaryPosition: 'FILL' }],
                },
            });
            expect(response.statusCode).toBe(400);
        });

        it('정상 요청 시 200과 결과를 반환해야 한다', async () => {
            mockedBalanceTeams.mockResolvedValue([{ rank: 1, teamA: [], teamB: [] }]);
            const response = await app.inject({
                method: 'POST',
                url: '/api/custom-game/balance',
                payload: {
                    players: [{ summonerName: 'P1', primaryPosition: 'TOP', secondaryPosition: 'FILL' }, { summonerName: 'P2', primaryPosition: 'MID', secondaryPosition: 'FILL' }],
                },
            });
            expect(response.statusCode).toBe(200);
            expect(JSON.parse(response.body).success).toBe(true);
        });
    });

    describe('GET /api/summoner/:name', () => {
        it('소환사 조회 성공 시 200을 반환해야 한다', async () => {
            mockedGetSummonerProfile.mockResolvedValue({ summonerName: '페이커' });
            const response = await app.inject({
                method: 'GET',
                url: `/api/summoner/${encodeURIComponent('페이커')}`,
            });
            expect(response.statusCode).toBe(200);
            expect(JSON.parse(response.body).data.summonerName).toBe('페이커');
        });
    });
});

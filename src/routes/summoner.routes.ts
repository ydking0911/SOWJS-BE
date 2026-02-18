/**
 * 소환사 라우트 정의 (Route Layer)
 * URL 경로와 컨트롤러 핸들러를 연결하고 Swagger 스키마를 정의합니다.
 */
import { FastifyInstance } from 'fastify';
import { getSummonerHandler } from '@controllers/summoner.controller';

/**
 * 소환사 관련 라우트를 Fastify 인스턴스에 등록합니다.
 */
export async function summonerRoutes(app: FastifyInstance): Promise<void> {
    /**
     * GET /api/summoner/:name
     * 소환사명으로 프로필 및 전적 정보를 조회합니다.
     */
    app.get(
        '/summoner/:name',
        {
            schema: {
                tags: ['Summoner'],
                summary: '소환사 프로필 조회',
                description: '소환사명으로 기본 정보, 랭크, 최근 전적 통계를 조회합니다. Redis 캐시를 활용하여 1시간 동안 결과를 캐싱합니다.',
                params: {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string',
                            description: '소환사명 (URL 인코딩 필요)',
                            example: '페이커',
                        },
                    },
                    required: ['name'],
                },
                response: {
                    200: {
                        description: '소환사 프로필 조회 성공',
                        type: 'object',
                        properties: {
                            success: { type: 'boolean', example: true },
                            data: {
                                type: 'object',
                                properties: {
                                    puuid: { type: 'string' },
                                    summonerName: { type: 'string' },
                                    summonerLevel: { type: 'number' },
                                    profileIconId: { type: 'number' },
                                    tier: { type: 'string', nullable: true, example: 'GOLD' },
                                    rank: { type: 'string', nullable: true, example: 'I' },
                                    lp: { type: 'number' },
                                    wins: { type: 'number' },
                                    losses: { type: 'number' },
                                    winRate: { type: 'number', description: '승률 (0~1)' },
                                    stats: {
                                        type: 'object',
                                        nullable: true,
                                        properties: {
                                            avgKda: { type: 'number' },
                                            avgCsPerMin: { type: 'number' },
                                            avgVisionScore: { type: 'number' },
                                            objectiveParticipation: { type: 'number' },
                                            primaryPosition: { type: 'string' },
                                            recentGamesAnalyzed: { type: 'number' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    404: {
                        description: '소환사를 찾을 수 없음',
                        type: 'object',
                        properties: {
                            success: { type: 'boolean', example: false },
                            error: { type: 'string', example: '소환사를 찾을 수 없습니다.' },
                        },
                    },
                },
            },
        },
        getSummonerHandler,
    );
}

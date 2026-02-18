/**
 * 내전 팀 밸런싱 라우트 정의 (Route Layer)
 * URL 경로와 컨트롤러 핸들러를 연결하고 Swagger 스키마를 정의합니다.
 */
import { FastifyInstance } from 'fastify';
import { balanceTeamsHandler } from '@controllers/customGame.controller';

/**
 * 내전 관련 라우트를 Fastify 인스턴스에 등록합니다.
 */
export async function customGameRoutes(app: FastifyInstance): Promise<void> {
    /**
     * POST /api/custom-game/balance
     * 플레이어 목록을 받아 최적 팀 구성 Top 3를 반환합니다.
     */
    app.post(
        '/custom-game/balance',
        {
            schema: {
                tags: ['Custom Game'],
                summary: '내전 팀 밸런싱',
                description: `
10명(또는 2~10명)의 소환사명과 포지션을 입력받아 AI 기반 최적 팀 구성을 반환합니다.

**처리 흐름:**
1. 각 소환사의 Riot API 데이터 수집 (최근 20게임)
2. 히든 MMR 산출 (AI 엔진)
3. 포지션 제약 조건을 고려한 팀 밸런싱 최적화
4. 예상 승률이 50:50에 가장 가까운 Top 3 조합 반환

**포지션 값:** TOP, JUNGLE, MID, ADC, SUPPORT, FILL
        `,
                body: {
                    type: 'object',
                    required: ['players'],
                    properties: {
                        players: {
                            type: 'array',
                            minItems: 2,
                            maxItems: 10,
                            items: {
                                type: 'object',
                                required: ['summonerName', 'primaryPosition', 'secondaryPosition'],
                                properties: {
                                    summonerName: {
                                        type: 'string',
                                        description: '소환사명',
                                        example: '페이커',
                                    },
                                    primaryPosition: {
                                        type: 'string',
                                        enum: ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT', 'FILL'],
                                        description: '주 포지션',
                                        example: 'MID',
                                    },
                                    secondaryPosition: {
                                        type: 'string',
                                        enum: ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT', 'FILL'],
                                        description: '부 포지션',
                                        example: 'FILL',
                                    },
                                },
                            },
                        },
                    },
                },
                response: {
                    200: {
                        description: '팀 밸런싱 성공',
                        type: 'object',
                        properties: {
                            success: { type: 'boolean', example: true },
                            data: {
                                type: 'object',
                                properties: {
                                    playerCount: { type: 'number', example: 10 },
                                    results: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                rank: { type: 'number', description: '추천 순위 (1~3)' },
                                                teamA: {
                                                    type: 'array',
                                                    items: {
                                                        type: 'object',
                                                        properties: {
                                                            summonerName: { type: 'string' },
                                                            assignedPosition: { type: 'string' },
                                                            hiddenMmr: { type: 'number' },
                                                            tier: { type: 'string' },
                                                            rank: { type: 'string' },
                                                        },
                                                    },
                                                },
                                                teamB: {
                                                    type: 'array',
                                                    items: {
                                                        type: 'object',
                                                        properties: {
                                                            summonerName: { type: 'string' },
                                                            assignedPosition: { type: 'string' },
                                                            hiddenMmr: { type: 'number' },
                                                            tier: { type: 'string' },
                                                            rank: { type: 'string' },
                                                        },
                                                    },
                                                },
                                                teamAWinRate: { type: 'number', description: '팀 A 예상 승률 (0~1)' },
                                                teamBWinRate: { type: 'number', description: '팀 B 예상 승률 (0~1)' },
                                                balanceScore: { type: 'number', description: '밸런스 점수 (낮을수록 균형)' },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    400: {
                        description: '잘못된 요청',
                        type: 'object',
                        properties: {
                            success: { type: 'boolean', example: false },
                            error: { type: 'string' },
                        },
                    },
                },
            },
        },
        balanceTeamsHandler,
    );
}

/**
 * 헬스체크 라우트 (Route Layer)
 * 서버 상태 및 의존성(Redis, AI 엔진) 상태를 확인합니다.
 */
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { getRedisClient } from '@utils/cache';
import axios from 'axios';
import { config } from '@config/index';

/**
 * 헬스체크 라우트를 Fastify 인스턴스에 등록합니다.
 */
export async function healthRoutes(app: FastifyInstance): Promise<void> {
    /**
     * GET /api/health
     * 서버 및 의존성 상태를 확인합니다.
     */
    app.get(
        '/health',
        {
            schema: {
                tags: ['Health'],
                summary: '서버 헬스체크',
                description: '서버 상태 및 Redis, AI 엔진 연결 상태를 확인합니다.',
                response: {
                    200: {
                        description: '서버 정상',
                        type: 'object',
                        properties: {
                            status: { type: 'string', example: 'ok' },
                            timestamp: { type: 'string' },
                            uptime: { type: 'number', description: '서버 업타임 (초)' },
                            dependencies: {
                                type: 'object',
                                properties: {
                                    redis: { type: 'string', enum: ['ok', 'error'] },
                                    aiEngine: { type: 'string', enum: ['ok', 'error'] },
                                },
                            },
                        },
                    },
                },
            },
        },
        async (_request: FastifyRequest, reply: FastifyReply) => {
            // Redis 연결 상태 확인
            let redisStatus = 'ok';
            try {
                const redis = getRedisClient();
                await redis.ping();
            } catch {
                redisStatus = 'error';
            }

            // AI 엔진 연결 상태 확인
            let aiEngineStatus = 'ok';
            try {
                await axios.get(`${config.aiEngine.baseUrl}/health`, { timeout: 3000 });
            } catch {
                aiEngineStatus = 'error';
            }

            reply.code(200).send({
                status: 'ok',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                dependencies: {
                    redis: redisStatus,
                    aiEngine: aiEngineStatus,
                },
            });
        },
    );
}

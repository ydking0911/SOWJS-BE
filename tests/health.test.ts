/**
 * API 통합 테스트 (헬스체크)
 * Fastify 앱을 직접 빌드하여 HTTP 요청/응답을 검증합니다.
 */
import { buildApp } from '../src/app';
import { FastifyInstance } from 'fastify';

// 외부 의존성 모킹
jest.mock('../src/utils/cache', () => ({
    getRedisClient: jest.fn(() => ({ ping: jest.fn().mockResolvedValue('PONG') })),
    getCache: jest.fn().mockResolvedValue(null),
    setCache: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('axios', () => ({
    ...jest.requireActual('axios'),
    get: jest.fn().mockResolvedValue({ data: { status: 'ok' } }),
    post: jest.fn(),
    create: jest.fn(() => ({
        get: jest.fn(),
        post: jest.fn(),
        interceptors: {
            response: { use: jest.fn() },
        },
    })),
}));

describe('Health Check API', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
        // 환경 변수 설정 (테스트용)
        process.env.RIOT_API_KEY = 'test-api-key';
        app = await buildApp();
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
    });

    it('GET /api/health → 200 OK를 반환해야 한다', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/api/health',
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.status).toBe('ok');
        expect(body).toHaveProperty('timestamp');
        expect(body).toHaveProperty('uptime');
        expect(body).toHaveProperty('dependencies');
    });

    it('GET /docs → Swagger UI 페이지를 반환해야 한다', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/docs',
        });

        // 리다이렉트 또는 HTML 응답
        expect([200, 302]).toContain(response.statusCode);
    });
});

/**
 * Fastify 애플리케이션 인스턴스 생성 및 플러그인 등록
 * 모든 플러그인, 라우트, 미들웨어를 여기서 조립합니다.
 */
import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

import { config } from '@config/index';
import { summonerRoutes } from '@routes/summoner.routes';
import { customGameRoutes } from '@routes/customGame.routes';
import { healthRoutes } from '@routes/health.routes';

/**
 * Fastify 인스턴스를 생성하고 모든 플러그인과 라우트를 등록합니다.
 * @returns 설정이 완료된 Fastify 인스턴스
 */
export async function buildApp(): Promise<FastifyInstance> {
    // ===========================
    // Fastify 인스턴스 생성
    // ===========================
    const app = Fastify({
        logger: {
            level: config.logger.level,
            // 개발 환경에서는 가독성 좋은 로그 출력
            transport: config.logger.prettyPrint
                ? { target: 'pino-pretty', options: { colorize: true } }
                : undefined,
        },
        // AJV 설정: Swagger에서 사용하는 'example' 키워드를 허용하도록 설정 (strict 모드 에러 방지)
        ajv: {
            customOptions: {
                allErrors: true,
                strict: false, // strict 모드 비활성화하여 'example' 등 비표준 키워드 허용
                keywords: ['example']
            }
        }
    });

    // ===========================
    // 보안 플러그인
    // ===========================

    // CORS: 프론트엔드(Vercel) 도메인에서의 요청 허용
    await app.register(cors, {
        origin: process.env.ALLOWED_ORIGINS?.split(',') ?? ['http://localhost:3000'],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        credentials: true,
    });

    // Helmet: 보안 HTTP 헤더 자동 설정
    await app.register(helmet, {
        contentSecurityPolicy: false, // Swagger UI를 위해 비활성화
    });

    // Rate Limiting: API 남용 방지 (IP당 분당 100회)
    await app.register(rateLimit, {
        max: 100,
        timeWindow: '1 minute',
        errorResponseBuilder: (_req, context) => ({
            statusCode: 429,
            error: 'Too Many Requests',
            message: `요청 한도를 초과했습니다. ${context.after} 후 다시 시도해주세요.`,
        }),
    });

    // ===========================
    // Swagger API 문서화
    // ===========================

    // Swagger 스키마 정의
    await app.register(swagger, {
        openapi: {
            openapi: '3.0.0',
            info: {
                title: 'SOWJS.KR API',
                description: `
## SOWJS.KR 백엔드 API 문서

SOWJS.KR(소우주)은 실질적인 게임 기여도 데이터와 AI 엔진을 활용하여 리그 오브 레전드 내전(커스텀 게임)의 팀 밸런스를 맞춰주는 서비스입니다.

### 주요 기능
- **소환사 정보 조회**: Riot API 기반 소환사 데이터 및 전적 검색
- **팀 밸런싱**: AI 엔진을 통한 최적 팀 구성 알고리즘
- **히든 MMR**: 실질 기여도 기반 내전용 MMR 산출

### 인증
현재 MVP 단계에서는 별도 인증 없이 사용 가능합니다.
        `,
                version: '0.1.0',
                contact: {
                    name: 'SOWJS.KR',
                },
            },
            tags: [
                { name: 'Health', description: '서버 상태 확인' },
                { name: 'Summoner', description: '소환사 정보 및 전적 조회' },
                { name: 'Custom Game', description: '내전 팀 밸런싱' },
            ],
            components: {
                schemas: {},
            },
        },
    });

    // Swagger UI: /docs 경로에서 인터랙티브 API 문서 제공
    await app.register(swaggerUi, {
        routePrefix: '/docs',
        uiConfig: {
            docExpansion: 'list',
            deepLinking: true,
        },
        staticCSP: false,
    });

    // ===========================
    // 라우트 등록 (MVC - Routes Layer)
    // ===========================
    await app.register(healthRoutes, { prefix: '/api' });
    await app.register(summonerRoutes, { prefix: '/api' });
    await app.register(customGameRoutes, { prefix: '/api' });

    return app;
}

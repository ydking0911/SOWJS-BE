/**
 * 환경 변수 설정 파일
 * dotenv를 통해 .env 파일을 로드하고, 필수 환경 변수를 검증합니다.
 */
import dotenv from 'dotenv';

// .env 파일 로드 (프로덕션에서는 환경 변수가 직접 주입됨)
dotenv.config();

/**
 * 서버 설정
 */
export const config = {
    // 서버
    server: {
        host: process.env.HOST ?? '0.0.0.0',
        port: parseInt(process.env.PORT ?? '4000', 10),
        env: process.env.NODE_ENV ?? 'development',
    },

    // Riot API
    riot: {
        apiKey: process.env.RIOT_API_KEY ?? '',
        baseUrl: 'https://kr.api.riotgames.com',     // KR 서버 기본값
        asiaUrl: 'https://asia.api.riotgames.com',   // 매치 데이터용 (v5)
        defaultRegion: process.env.RIOT_DEFAULT_REGION ?? 'kr',
    },

    // PostgreSQL
    db: {
        host: process.env.DB_HOST ?? 'localhost',
        port: parseInt(process.env.DB_PORT ?? '5432', 10),
        name: process.env.DB_NAME ?? 'teamgg',
        user: process.env.DB_USER ?? 'postgres',
        password: process.env.DB_PASSWORD ?? '',
    },

    // Redis
    redis: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
        password: process.env.REDIS_PASSWORD ?? undefined,
        ttl: {
            summoner: 3600,      // 소환사 정보 캐시: 1시간
            matches: 3600,       // 매치 목록 캐시: 1시간
            stats: 3600,         // 통계 데이터 캐시: 1시간
            metaChampions: 86400, // 메타 챔피언 캐시: 24시간
        },
    },

    // AI 엔진 (Python FastAPI)
    aiEngine: {
        baseUrl: process.env.AI_ENGINE_URL ?? 'http://localhost:8000',
        timeout: parseInt(process.env.AI_ENGINE_TIMEOUT ?? '30000', 10), // 30초
    },

    // 로깅
    logger: {
        level: process.env.LOG_LEVEL ?? 'info',
        prettyPrint: process.env.NODE_ENV !== 'production',
    },
};

/**
 * 필수 환경 변수 검증
 * 서버 시작 시 필수 값이 없으면 즉시 종료합니다.
 */
export function validateConfig(): void {
    const required = ['RIOT_API_KEY'];
    const missing = required.filter((key) => !process.env[key]);

    if (missing.length > 0) {
        console.error(`[Config] 필수 환경 변수가 설정되지 않았습니다: ${missing.join(', ')}`);
        process.exit(1);
    }
}

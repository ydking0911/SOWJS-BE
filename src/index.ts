/**
 * 서버 진입점 (Entry Point)
 * 애플리케이션을 시작하고 포트를 열어 요청을 수신합니다.
 */
import { buildApp } from './app';
import { config, validateConfig } from '@config/index';

/**
 * 서버를 시작합니다.
 * 환경 변수 검증 → 앱 빌드 → 포트 리스닝 순서로 실행됩니다.
 */
async function start(): Promise<void> {
    // 1. 필수 환경 변수 검증 (없으면 즉시 종료)
    validateConfig();

    // 2. Fastify 앱 인스턴스 생성
    const app = await buildApp();

    try {
        // 3. 서버 시작
        await app.listen({
            host: config.server.host,
            port: config.server.port,
        });

        app.log.info(`🚀 SOWJS.KR API 서버 시작: http://${config.server.host}:${config.server.port}`);
        app.log.info(`📖 Swagger 문서: http://${config.server.host}:${config.server.port}/docs`);
        app.log.info(`🌍 환경: ${config.server.env}`);
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
}

// 예상치 못한 에러 처리
process.on('uncaughtException', (err) => {
    console.error('[uncaughtException]', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason) => {
    console.error('[unhandledRejection]', reason);
    process.exit(1);
});

start();

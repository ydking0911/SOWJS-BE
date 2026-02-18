/**
 * Redis 캐시 유틸리티
 * ioredis를 래핑하여 타입 안전한 캐시 인터페이스를 제공합니다.
 */
import Redis from 'ioredis';
import { config } from '@config/index';

// Redis 클라이언트 싱글톤 인스턴스
let redisClient: Redis | null = null;

/**
 * Redis 클라이언트를 반환합니다. (싱글톤 패턴)
 * 처음 호출 시 연결을 생성하고, 이후에는 기존 연결을 재사용합니다.
 */
export function getRedisClient(): Redis {
    if (!redisClient) {
        redisClient = new Redis({
            host: config.redis.host,
            port: config.redis.port,
            password: config.redis.password,
            lazyConnect: true,
            retryStrategy: (times) => {
                // 최대 3회 재시도, 지수 백오프
                if (times > 3) return null;
                return Math.min(times * 200, 2000);
            },
        });

        redisClient.on('error', (err) => {
            console.error('[Redis] 연결 오류:', err.message);
        });

        redisClient.on('connect', () => {
            console.info('[Redis] 연결 성공');
        });
    }

    return redisClient;
}

/**
 * 캐시에서 값을 가져옵니다.
 * @param key - 캐시 키
 * @returns 파싱된 값 또는 null (캐시 미스)
 */
export async function getCache<T>(key: string): Promise<T | null> {
    try {
        const redis = getRedisClient();
        const value = await redis.get(key);
        if (!value) return null;
        return JSON.parse(value) as T;
    } catch {
        // 캐시 오류는 서비스를 중단시키지 않음 (graceful degradation)
        return null;
    }
}

/**
 * 캐시에 값을 저장합니다.
 * @param key - 캐시 키
 * @param value - 저장할 값 (JSON 직렬화됨)
 * @param ttlSeconds - 만료 시간 (초)
 */
export async function setCache<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    try {
        const redis = getRedisClient();
        await redis.setex(key, ttlSeconds, JSON.stringify(value));
    } catch {
        // 캐시 저장 실패는 무시 (서비스 지속성 우선)
    }
}

/**
 * 캐시를 삭제합니다.
 * @param key - 삭제할 캐시 키
 */
export async function deleteCache(key: string): Promise<void> {
    try {
        const redis = getRedisClient();
        await redis.del(key);
    } catch {
        // 무시
    }
}

describe('Utility Tests', () => {
    let riotClient: any;
    let cache: any;
    let mockAxiosInstance: any;

    beforeEach(() => {
        // 모듈 캐시 초기화
        jest.resetModules();

        // 모킹 인스턴스 정의
        mockAxiosInstance = {
            get: jest.fn(),
            interceptors: {
                response: {
                    use: jest.fn(),
                },
            },
        };

        // axios 모킹
        jest.doMock('axios', () => ({
            create: jest.fn(() => mockAxiosInstance),
            isAxiosError: jest.fn((obj) => !!(obj && obj.isAxiosError)),
        }));

        // ioredis 모킹
        jest.doMock('ioredis', () => {
            return jest.fn().mockImplementation(() => ({
                get: jest.fn().mockResolvedValue(null),
                setex: jest.fn().mockResolvedValue('OK'),
                on: jest.fn(),
            }));
        });

        // 모듈 다이내믹 로드
        riotClient = require('../src/utils/riotClient');
        cache = require('../src/utils/cache');
    });

    describe('riotClient.ts', () => {
        it('Riot API 호출 성공 시 데이터를 반환해야 한다', async () => {
            mockAxiosInstance.get.mockResolvedValue({ data: { name: '페이커' } });
            const result = await riotClient.getSummonerByName('페이커');
            expect(result.name).toBe('페이커');
        });

        it('Riot API 호출 실패 시 RiotApiError를 던져야 한다', async () => {
            const mockUse = mockAxiosInstance.interceptors.response.use;

            // riotClient.ts가 require될 때 addErrorInterceptor가 호출되었는지 확인
            expect(mockUse).toHaveBeenCalled();
            const errorHandler = mockUse.mock.calls[0][1];

            const axiosError = {
                isAxiosError: true,
                response: { status: 404 },
            };

            // require된 모듈 내부의 RiotApiError와 비교해야 함 (constructor 일치를 위해)
            expect(() => errorHandler(axiosError)).toThrow(riotClient.RiotApiError);
        });
    });

    describe('cache.ts', () => {
        it('getCache/setCache 호출 시 에러가 발생하지 않아야 한다 (기본 동작)', async () => {
            await expect(cache.setCache('key', { a: 1 }, 10)).resolves.not.toThrow();
            const result = await cache.getCache('key');
            expect(result).toBeNull();
        });
    });
});

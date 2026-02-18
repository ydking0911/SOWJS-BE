/**
 * 소환사 컨트롤러 (Controller Layer)
 * HTTP 요청을 받아 서비스를 호출하고 응답을 반환합니다.
 * 비즈니스 로직은 서비스 레이어에 위임합니다.
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { getSummonerProfile } from '@services/summoner.service';
import { RiotApiError } from '@utils/riotClient';

/**
 * GET /api/summoner/:name
 * 소환사명으로 프로필 및 전적 정보를 조회합니다.
 */
export async function getSummonerHandler(
    request: FastifyRequest<{ Params: { name: string } }>,
    reply: FastifyReply,
): Promise<void> {
    const { name } = request.params;

    try {
        const profile = await getSummonerProfile(name);
        reply.code(200).send({
            success: true,
            data: profile,
        });
    } catch (err) {
        if (err instanceof RiotApiError) {
            // Riot API 에러는 상태 코드 그대로 전달
            reply.code(err.statusCode).send({
                success: false,
                error: err.message,
            });
            return;
        }
        // 예상치 못한 에러
        request.log.error(err);
        reply.code(500).send({
            success: false,
            error: '서버 내부 오류가 발생했습니다.',
        });
    }
}

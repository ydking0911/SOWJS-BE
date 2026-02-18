/**
 * 내전 팀 밸런싱 컨트롤러 (Controller Layer)
 * 팀 구성 요청을 받아 서비스를 호출하고 결과를 반환합니다.
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { balanceTeams } from '@services/customGame.service';
import { PlayerInput, Position } from '@models/summoner.model';
import { RiotApiError } from '@utils/riotClient';

/**
 * POST /api/custom-game/balance 요청 바디 타입
 */
interface BalanceRequestBody {
    players: Array<{
        summonerName: string;
        primaryPosition: string;
        secondaryPosition: string;
    }>;
}

/**
 * POST /api/custom-game/balance
 * 플레이어 목록을 받아 최적 팀 구성 Top 3를 반환합니다.
 */
export async function balanceTeamsHandler(
    request: FastifyRequest<{ Body: BalanceRequestBody }>,
    reply: FastifyReply,
): Promise<void> {
    const { players } = request.body;

    // 입력 유효성 검사
    if (!players || players.length < 2 || players.length > 10) {
        reply.code(400).send({
            success: false,
            error: '플레이어 수는 2명 이상 10명 이하여야 합니다.',
        });
        return;
    }

    // 포지션 값 유효성 검사
    const validPositions = Object.values(Position);
    for (const player of players) {
        if (!validPositions.includes(player.primaryPosition as Position)) {
            reply.code(400).send({
                success: false,
                error: `유효하지 않은 포지션입니다: ${player.primaryPosition}`,
            });
            return;
        }
    }

    try {
        const playerInputs: PlayerInput[] = players.map((p) => ({
            summonerName: p.summonerName,
            primaryPosition: p.primaryPosition as Position,
            secondaryPosition: p.secondaryPosition as Position,
        }));

        const results = await balanceTeams(playerInputs);

        reply.code(200).send({
            success: true,
            data: {
                playerCount: players.length,
                results,
            },
        });
    } catch (err) {
        if (err instanceof RiotApiError) {
            reply.code(err.statusCode).send({
                success: false,
                error: err.message,
            });
            return;
        }
        request.log.error(err);
        reply.code(500).send({
            success: false,
            error: '팀 구성 중 오류가 발생했습니다.',
        });
    }
}

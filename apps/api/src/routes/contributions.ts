import { FastifyInstance } from 'fastify';
import { PrismaClient, ContributionType } from '@prisma/client';
import { optionalAuth } from '../middleware/auth.js';

const prisma = new PrismaClient();

type RankedEntry = {
  userId: string;
  username?: string | null;
  name?: string | null;
  email?: string | null;
  contributions: number;
  approvals: number;
  votes: number;
  rank: number;
};

type CurrentUserEntry = Omit<RankedEntry, 'rank'> & { rank: number | null };

export async function contributionRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/api/contributions/leaderboard',
    { preHandler: optionalAuth },
    async (request, reply) => {
      try {
        const totals = await prisma.contribution.groupBy({
          by: ['userId'],
          _count: {
            _all: true,
          },
        });

        const totalContributions = totals.reduce(
          (sum, entry) => sum + entry._count._all,
          0
        );

        const userIds = totals.map((entry) => entry.userId);

        const approvalCounts = await prisma.contribution.groupBy({
          by: ['userId'],
          where: { type: ContributionType.theory_approved },
          _count: { _all: true },
        });
        const voteCounts = await prisma.contribution.groupBy({
          by: ['userId'],
          where: { type: ContributionType.theory_vote },
          _count: { _all: true },
        });

        const approvalMap = new Map(
          approvalCounts.map((entry) => [entry.userId, entry._count._all])
        );
        const voteMap = new Map(
          voteCounts.map((entry) => [entry.userId, entry._count._all])
        );

        const users = userIds.length
          ? await prisma.user.findMany({
              where: { id: { in: userIds } },
              select: { id: true, username: true, name: true, email: true },
            })
          : [];
        const userMap = new Map(users.map((user) => [user.id, user]));

        const leaderboard: RankedEntry[] = totals
          .map((entry) => {
            const user = userMap.get(entry.userId);
            return {
              userId: entry.userId,
              username: user?.username,
              name: user?.name,
              email: user?.email,
              contributions: entry._count._all,
              approvals: approvalMap.get(entry.userId) ?? 0,
              votes: voteMap.get(entry.userId) ?? 0,
              rank: 0,
            };
          })
          .sort((a, b) => {
            if (b.contributions !== a.contributions) {
              return b.contributions - a.contributions;
            }
            if (b.approvals !== a.approvals) {
              return b.approvals - a.approvals;
            }
            const nameA = a.username || a.name || a.email || '';
            const nameB = b.username || b.name || b.email || '';
            return nameA.localeCompare(nameB);
          })
          .map((entry, index) => ({
            ...entry,
            rank: index + 1,
          }));

        const topFifty = leaderboard.slice(0, 50);

        let currentUser: CurrentUserEntry | null = null;
        if (request.user) {
          const userRecord = await prisma.user.findUnique({
            where: { stackAuthId: request.user.stackAuthId },
            select: { id: true, username: true, name: true, email: true },
          });
          if (userRecord) {
            const leaderboardEntry = leaderboard.find(
              (entry) => entry.userId === userRecord.id
            );
            if (leaderboardEntry) {
              currentUser = leaderboardEntry;
            } else {
              currentUser = {
                userId: userRecord.id,
                username: userRecord.username,
                name: userRecord.name,
                email: userRecord.email,
                contributions: 0,
                approvals: 0,
                votes: 0,
                rank: null,
              };
            }
          }
        }

        return {
          leaderboard: topFifty,
          totalContributions,
          totalContributors: leaderboard.length,
          currentUser,
        };
      } catch (error: any) {
        fastify.log.error(error);
        return reply
          .code(500)
          .send({
            error: { message: error?.message || 'Failed to load leaderboard' },
          });
      }
    }
  );

  fastify.get(
    '/api/contributions/stats',
    async (_request, reply) => {
      try {
        const totalContributions = await prisma.contribution.count();
        const contributors = await prisma.contribution.groupBy({
          by: ['userId'],
        });

        return {
          totalContributions,
          totalContributors: contributors.length,
        };
      } catch (error: any) {
        fastify.log.error(error);
        return reply
          .code(500)
          .send({
            error: { message: error?.message || 'Failed to load contribution stats' },
          });
      }
    }
  );
}

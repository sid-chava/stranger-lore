import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticateUser, optionalAuth } from '../middleware/auth.js';

const prisma = new PrismaClient();

// Helper to check if user has admin role
async function requireAdmin(request: any, reply: any): Promise<void> {
  if (!request.user) {
    reply.code(401).send({ error: 'Unauthorized' });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { stackAuthId: request.user.stackAuthId },
    include: { userRoles: { include: { role: true } } },
  });

  if (!user) {
    reply.code(401).send({ error: 'User not found' });
    return;
  }

  const hasAdmin = user.userRoles.some((ur: any) => ur.role.name === 'admin');
  if (!hasAdmin) {
    reply.code(403).send({ error: 'Admin access required' });
    return;
  }
}

// Zod schemas
const TheoryCreateSchema = z.object({
  content: z.string().min(1).max(5000),
});

const TheoryModerateSchema = z.object({
  status: z.enum(['approved', 'denied']),
  tagIds: z.array(z.string().uuid()).optional(),
  denialReason: z.string().max(500).optional(),
});

const TheoryVoteSchema = z.object({
  value: z.enum(['1', '-1']).transform((val) => parseInt(val)),
});

export async function theoryRoutes(fastify: FastifyInstance) {
  // Create theory (authenticated users)
  fastify.post(
    '/api/theories',
    { preHandler: authenticateUser },
    async (request, reply) => {
      try {
        if (!request.user) {
          return reply.code(401).send({ error: 'Unauthorized' });
        }

        const parsed = TheoryCreateSchema.safeParse(request.body);
        if (!parsed.success) {
          return reply.code(400).send({ error: parsed.error.errors });
        }

        const user = await prisma.user.findUnique({
          where: { stackAuthId: request.user.stackAuthId },
        });

        if (!user) {
          return reply.code(401).send({ error: 'User not found' });
        }

        const theory = await prisma.theory.create({
          data: {
            content: parsed.data.content,
            createdById: user.id,
            status: 'pending',
          },
        });

        return { theory };
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({ error: { message: error?.message || 'Failed to create theory' } });
      }
    }
  );

  // Get unmoderated theories (admin only)
  fastify.get(
    '/api/theories/unmoderated',
    { preHandler: [authenticateUser, requireAdmin] },
    async (request, reply) => {
      try {
        const theories = await prisma.theory.findMany({
          where: { status: 'pending' },
          include: {
            createdBy: {
              select: { id: true, email: true, name: true },
            },
            tags: {
              include: {
                tag: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        return { theories };
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({ error: { message: error?.message || 'Failed to fetch theories' } });
      }
    }
  );

  // Moderate theory (approve/deny with tags) - admin only
  fastify.post(
    '/api/theories/:id/moderate',
    { preHandler: [authenticateUser, requireAdmin] },
    async (request, reply) => {
      try {
        if (!request.user) {
          return reply.code(401).send({ error: 'Unauthorized' });
        }

        const { id } = request.params as { id: string };
        const parsed = TheoryModerateSchema.safeParse(request.body);
        if (!parsed.success) {
          return reply.code(400).send({ error: parsed.error.errors });
        }

        const moderator = await prisma.user.findUnique({
          where: { stackAuthId: request.user.stackAuthId },
        });

        if (!moderator) {
          return reply.code(401).send({ error: 'Moderator not found' });
        }

        const theory = await prisma.theory.findUnique({
          where: { id },
        });

        if (!theory) {
          return reply.code(404).send({ error: 'Theory not found' });
        }

        // Update theory status and tags
        await prisma.$transaction(async (tx: any) => {
          await tx.theory.update({
            where: { id },
            data: {
              status: parsed.data.status,
              moderatedById: moderator.id,
              moderatedAt: new Date(),
              denialReason: parsed.data.denialReason || null,
            },
          });

          // Remove existing tags
          await tx.theoryTag.deleteMany({
            where: { theoryId: id },
          });

          // Add new tags if provided
          if (parsed.data.tagIds && parsed.data.tagIds.length > 0) {
            await tx.theoryTag.createMany({
              data: parsed.data.tagIds.map((tagId: string) => ({
                theoryId: id,
                tagId,
              })),
            });
          }
        });

        const updated = await prisma.theory.findUnique({
          where: { id },
          include: {
            tags: {
              include: { tag: true },
            },
          },
        });

        return { theory: updated };
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({ error: { message: error?.message || 'Failed to moderate theory' } });
      }
    }
  );

  // Get all tags (for admin tag selector)
  fastify.get(
    '/api/tags',
    { preHandler: [authenticateUser, requireAdmin] },
    async (request, reply) => {
      try {
        const tags = await prisma.tag.findMany({
          orderBy: { name: 'asc' },
        });

        return { tags };
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({ error: { message: error?.message || 'Failed to fetch tags' } });
      }
    }
  );

  // Create tag (admin only)
  fastify.post(
    '/api/tags',
    { preHandler: [authenticateUser, requireAdmin] },
    async (request, reply) => {
      try {
        const { name } = request.body as { name: string };
        if (!name || name.trim().length === 0) {
          return reply.code(400).send({ error: 'Tag name required' });
        }

        const tag = await prisma.tag.upsert({
          where: { name: name.trim().toLowerCase() },
          update: {},
          create: { name: name.trim().toLowerCase() },
        });

        return { tag };
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({ error: { message: error?.message || 'Failed to create tag' } });
      }
    }
  );

  // Get top theories (Hacker News style) - public
  fastify.get(
    '/api/theories/top',
    { preHandler: optionalAuth },
    async (request, reply) => {
      try {
        // Get all approved theories with vote counts
        const theories = await prisma.theory.findMany({
          where: { status: 'approved' },
          include: {
            createdBy: {
              select: { id: true, email: true, name: true },
            },
            tags: {
              include: { tag: true },
            },
            votes: true,
            _count: {
              select: { votes: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        // Get current user if authenticated
        let currentUserId: string | null = null;
        if (request.user) {
          const currentUser = await prisma.user.findUnique({
            where: { stackAuthId: request.user.stackAuthId },
            select: { id: true },
          });
          currentUserId = currentUser?.id || null;
        }

        // Calculate score (upvotes - downvotes) and sort
        const theoriesWithScore = theories.map((theory: any) => {
          const upvotes = theory.votes.filter((v: any) => v.value === 1).length;
          const downvotes = theory.votes.filter((v: any) => v.value === -1).length;
          const score = upvotes - downvotes;
          const userVote = currentUserId
            ? theory.votes.find((v: any) => v.userId === currentUserId)?.value || null
            : null;

          return {
            id: theory.id,
            content: theory.content,
            score,
            upvotes,
            downvotes,
            userVote,
            createdAt: theory.createdAt,
            createdBy: theory.createdBy,
            tags: theory.tags.map((tt: any) => tt.tag),
          };
        });

        // Sort by score (descending), then by date
        theoriesWithScore.sort((a: any, b: any) => {
          if (b.score !== a.score) return b.score - a.score;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        return { theories: theoriesWithScore };
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({ error: { message: error?.message || 'Failed to fetch theories' } });
      }
    }
  );

  // Vote on theory (authenticated users)
  fastify.post(
    '/api/theories/:id/vote',
    { preHandler: authenticateUser },
    async (request, reply) => {
      try {
        if (!request.user) {
          return reply.code(401).send({ error: 'Unauthorized' });
        }

        const { id } = request.params as { id: string };
        const parsed = TheoryVoteSchema.safeParse(request.body);
        if (!parsed.success) {
          return reply.code(400).send({ error: parsed.error.errors });
        }

        const user = await prisma.user.findUnique({
          where: { stackAuthId: request.user.stackAuthId },
        });

        if (!user) {
          return reply.code(401).send({ error: 'User not found' });
        }

        const theory = await prisma.theory.findUnique({
          where: { id },
        });

        if (!theory || theory.status !== 'approved') {
          return reply.code(404).send({ error: 'Theory not found or not approved' });
        }

        // Upsert vote (user can change their vote)
        await prisma.vote.upsert({
          where: {
            theoryId_userId: {
              theoryId: id,
              userId: user.id,
            },
          },
          update: {
            value: parsed.data.value,
          },
          create: {
            theoryId: id,
            userId: user.id,
            value: parsed.data.value,
          },
        });

        // Get updated vote counts
        const votes = await prisma.vote.findMany({
          where: { theoryId: id },
        });

        const upvotes = votes.filter((v) => v.value === 1).length;
        const downvotes = votes.filter((v) => v.value === -1).length;
        const score = upvotes - downvotes;

        return { score, upvotes, downvotes, userVote: parsed.data.value };
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({ error: { message: error?.message || 'Failed to vote' } });
      }
    }
  );
}


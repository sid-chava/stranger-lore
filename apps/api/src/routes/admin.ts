import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { authenticateUser } from '../middleware/auth';
import { z } from 'zod';

const prisma = new PrismaClient();

// Helper to check if user has admin role
async function requireAdmin(
  request: any,
  reply: any
): Promise<void> {
  if (!request.user) {
    reply.code(401).send({ error: 'Unauthorized' });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { stackAuthId: request.user.stackAuthId },
    include: {
      userRoles: {
        include: {
          role: true,
        },
      },
    },
  });

  if (!user) {
    reply.code(401).send({ error: 'User not found' });
    return;
  }

  const hasAdminRole = user.userRoles.some((ur: any) => ur.role.name === 'admin');
  if (!hasAdminRole) {
    reply.code(403).send({ error: 'Admin access required' });
    return;
  }
}

export async function adminRoutes(fastify: FastifyInstance) {
  // Get all users with their roles
  fastify.get(
    '/api/admin/users',
    { preHandler: [authenticateUser, requireAdmin] },
    async (request, reply) => {
      try {
        const users = await prisma.user.findMany({
          include: {
            userRoles: {
              include: {
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        return {
          users: users.map((user: any) => ({
            id: user.id,
            stackAuthId: user.stackAuthId,
            email: user.email,
            name: user.name,
            roles: user.userRoles.map((ur: any) => ur.role.name),
            createdAt: user.createdAt,
          })),
        };
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({ error: 'Failed to fetch users' });
      }
    }
  );

  // Get all available roles
  fastify.get(
    '/api/admin/roles',
    { preHandler: [authenticateUser, requireAdmin] },
    async (request, reply) => {
      try {
        const roles = await prisma.role.findMany({
          orderBy: {
            name: 'asc',
          },
        });

        return { roles };
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({ error: 'Failed to fetch roles' });
      }
    }
  );

  // Assign role to user
  const assignRoleSchema = z.object({
    userId: z.string().uuid(),
    roleName: z.enum(['admin', 'editor', 'reader']),
  });

  fastify.post(
    '/api/admin/users/:userId/roles',
    { preHandler: [authenticateUser, requireAdmin] },
    async (request, reply) => {
      try {
        const { userId } = request.params as { userId: string };
        const { roleName } = request.body as { roleName: string };

        // Validate input
        const validation = assignRoleSchema.safeParse({ userId, roleName });
        if (!validation.success) {
          return reply.code(400).send({ error: validation.error.errors });
        }

        // Get role
        const role = await prisma.role.findUnique({
          where: { name: validation.data.roleName },
        });

        if (!role) {
          return reply.code(404).send({ error: 'Role not found' });
        }

        // Check if user exists
        const user = await prisma.user.findUnique({
          where: { id: validation.data.userId },
        });

        if (!user) {
          return reply.code(404).send({ error: 'User not found' });
        }

        // Assign role (upsert to avoid duplicates)
        const userRole = await prisma.userRole.upsert({
          where: {
            userId_roleId: {
              userId: user.id,
              roleId: role.id,
            },
          },
          update: {},
          create: {
            userId: user.id,
            roleId: role.id,
          },
          include: {
            role: true,
            user: {
              include: {
                userRoles: {
                  include: {
                    role: true,
                  },
                },
              },
            },
          },
        });

        return {
          message: 'Role assigned successfully',
          user: {
            id: userRole.user.id,
            email: userRole.user.email,
            name: userRole.user.name,
            roles: userRole.user.userRoles.map((ur: any) => ur.role.name),
          },
        };
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({ error: 'Failed to assign role' });
      }
    }
  );

  // Remove role from user
  fastify.delete(
    '/api/admin/users/:userId/roles/:roleName',
    { preHandler: [authenticateUser, requireAdmin] },
    async (request, reply) => {
      try {
        const { userId, roleName } = request.params as {
          userId: string;
          roleName: string;
        };

        // Get role
        const role = await prisma.role.findUnique({
          where: { name: roleName },
        });

        if (!role) {
          return reply.code(404).send({ error: 'Role not found' });
        }

        // Get user
        const user = await prisma.user.findUnique({
          where: { id: userId },
        });

        if (!user) {
          return reply.code(404).send({ error: 'User not found' });
        }

        // Remove role
        await prisma.userRole.deleteMany({
          where: {
            userId: user.id,
            roleId: role.id,
          },
        });

        // Get updated user
        const updatedUser = await prisma.user.findUnique({
          where: { id: user.id },
          include: {
            userRoles: {
              include: {
                role: true,
              },
            },
          },
        });

        return {
          message: 'Role removed successfully',
          user: {
            id: updatedUser!.id,
            email: updatedUser!.email,
            name: updatedUser!.name,
            roles: updatedUser!.userRoles.map((ur: any) => ur.role.name),
          },
        };
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({ error: 'Failed to remove role' });
      }
    }
  );
}


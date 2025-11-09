import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { authenticateUser } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const prisma = new PrismaClient();

// List of emails that should automatically get admin role
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'siddarth.chava@gmail.com')
  .split(',')
  .map((email) => email.trim().toLowerCase());

// Helper to get email from JWT token
function getEmailFromToken(token: string): string | null {
  try {
    const decoded = jwt.decode(token) as jwt.JwtPayload | null;
    return decoded?.email?.toLowerCase() || null;
  } catch {
    return null;
  }
}

// Helper to assign admin role if email matches
async function assignAdminRoleIfNeeded(
  userId: string,
  email: string | null
): Promise<void> {
  if (!email || !ADMIN_EMAILS.includes(email.toLowerCase())) {
    return;
  }

  // Get admin role
  const adminRole = await prisma.role.findUnique({
    where: { name: 'admin' },
  });

  if (!adminRole) {
    return;
  }

  // Assign admin role (upsert to avoid duplicates)
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId,
      roleId: adminRole.id,
    },
  });
}

export async function authRoutes(fastify: FastifyInstance) {
  // Get current user info
  fastify.get(
    '/api/auth/me',
    { preHandler: authenticateUser },
    async (request, reply) => {
      if (!request.user) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      try {
        // Get email from token if available
        const authHeader = request.headers.authorization;
        const token = authHeader?.substring(7); // Remove 'Bearer '
        const emailFromToken = token ? getEmailFromToken(token) : null;

        // Find or create user in our database
        let user = await prisma.user.findUnique({
          where: { stackAuthId: request.user.stackAuthId },
          include: {
            userRoles: {
              include: {
                role: true,
              },
            },
          },
        });

        // Create user if doesn't exist (first login)
        if (!user) {
          user = await prisma.user.create({
            data: {
              stackAuthId: request.user.stackAuthId,
              email: emailFromToken || undefined,
            },
            include: {
              userRoles: {
                include: {
                  role: true,
                },
              },
            },
          });

          // Auto-assign admin role if email matches
          if (emailFromToken) {
            await assignAdminRoleIfNeeded(user.id, emailFromToken);
            // Refresh user to get updated roles
            user = await prisma.user.findUnique({
              where: { id: user.id },
              include: {
                userRoles: {
                  include: {
                    role: true,
                  },
                },
              },
            }) || user;
          }
        } else {
          // Update email if we have it and user doesn't have one
          if (emailFromToken && !user.email) {
            await prisma.user.update({
              where: { id: user.id },
              data: { email: emailFromToken },
            });
            user.email = emailFromToken;
          }

          // Check if admin role should be assigned (for existing users too)
          await assignAdminRoleIfNeeded(user.id, user.email || emailFromToken);
          
          // Refresh user to get updated roles
          user = await prisma.user.findUnique({
            where: { id: user.id },
            include: {
              userRoles: {
                include: {
                  role: true,
                },
              },
            },
          }) || user;
        }

        const roles = user.userRoles.map((ur: any) => ur.role.name);

        return {
          id: user.id,
          stackAuthId: user.stackAuthId,
          email: user.email,
          name: user.name,
          username: user.username,
          roles,
        };
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({ error: 'Failed to fetch user' });
      }
    }
  );

  const UsernameSchema = z.object({
    username: z
      .string()
      .trim()
      .min(3, 'Username must be at least 3 characters')
      .max(20, 'Username must be at most 20 characters')
      .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscores are allowed'),
  });

  fastify.put(
    '/api/auth/username',
    { preHandler: authenticateUser },
    async (request, reply) => {
      try {
        if (!request.user) {
          return reply.code(401).send({ error: 'Unauthorized' });
        }

        const parsed = UsernameSchema.safeParse(request.body);
        if (!parsed.success) {
          return reply.code(400).send({ error: parsed.error.errors });
        }

        const desiredUsername = parsed.data.username.toLowerCase();

        // Check for collisions with other users
        const existing = await prisma.user.findUnique({
          where: { username: desiredUsername },
        });

        if (existing && existing.stackAuthId !== request.user.stackAuthId) {
          return reply.code(409).send({ error: 'Username already taken' });
        }

        const updatedUser = await prisma.user.update({
          where: { stackAuthId: request.user.stackAuthId },
          data: { username: desiredUsername },
          include: {
            userRoles: {
              include: {
                role: true,
              },
            },
          },
        });

        return {
          id: updatedUser.id,
          username: updatedUser.username,
          roles: updatedUser.userRoles.map((ur: any) => ur.role.name),
        };
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({ error: 'Failed to update username' });
      }
    }
  );
}

import { FastifyRequest, FastifyReply } from 'fastify';
import type { JWTPayload } from 'jose';
import { verifyStackAuthToken } from '../lib/stackAuth.js';

export interface AuthenticatedUser {
  stackAuthId: string;
  userId?: string;
  tokenPayload?: JWTPayload;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthenticatedUser;
  }
}

function extractToken(request: FastifyRequest): string | undefined {
  const stackAuthHeader = request.headers['x-stack-auth'];
  if (typeof stackAuthHeader === 'string' && stackAuthHeader.trim()) {
    return stackAuthHeader.trim();
  }
  const authHeader = request.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return undefined;
}

async function setRequestUserFromToken(request: FastifyRequest, token: string): Promise<void> {
  const verified = await verifyStackAuthToken(token);
  request.user = {
    stackAuthId: verified.stackAuthId,
    tokenPayload: verified.payload,
  };
}

// JWT verification middleware
export async function authenticateUser(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const token = extractToken(request);
    if (!token) {
      reply.code(401).send({ error: 'Missing or invalid authorization header' });
      return;
    }
    await setRequestUserFromToken(request, token);
  } catch (error) {
    reply.code(401).send({ error: 'Authentication failed' });
  }
}

// Optional authentication - doesn't fail if no token
export async function optionalAuth(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  try {
    const token = extractToken(request);
    if (!token) {
      return;
    }
    await setRequestUserFromToken(request, token);
  } catch {
    // Silently swallow optional auth errors
  }
}

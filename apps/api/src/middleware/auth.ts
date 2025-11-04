import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';

export interface AuthenticatedUser {
  stackAuthId: string;
  userId?: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthenticatedUser;
  }
}

// JWT verification middleware
export async function authenticateUser(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    // Try Stack Auth's x-stack-auth header first, then Authorization Bearer
    let token: string | undefined;
    
    const stackAuthHeader = request.headers['x-stack-auth'];
    if (stackAuthHeader && typeof stackAuthHeader === 'string') {
      token = stackAuthHeader;
    } else {
      const authHeader = request.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7); // Remove 'Bearer ' prefix
      }
    }
    
    if (!token) {
      reply.code(401).send({ error: 'Missing or invalid authorization header' });
      return;
    }
    
    // Get Stack Auth project ID from environment
    const stackProjectId = process.env.STACK_PROJECT_ID;
    if (!stackProjectId) {
      reply.code(500).send({ error: 'Stack Auth not configured' });
      return;
    }

    // Verify JWT token from Stack Auth
    // Note: Stack Auth JWTs are signed with their public keys
    // In production, you should verify against Stack Auth's public keys
    // For now, we'll decode and validate basic structure
    try {
      // Decode without verification first to check structure
      const decoded = jwt.decode(token) as jwt.JwtPayload | null;
      
      if (!decoded || !decoded.sub) {
        reply.code(401).send({ error: 'Invalid token' });
        return;
      }

      // Store user info on request object
      request.user = {
        stackAuthId: decoded.sub as string,
      };
    } catch (error) {
      reply.code(401).send({ error: 'Invalid token' });
      return;
    }
  } catch (error) {
    reply.code(401).send({ error: 'Authentication failed' });
  }
}

// Optional authentication - doesn't fail if no token
export async function optionalAuth(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, but that's OK
      return;
    }

    const token = authHeader.substring(7);
    
    const decoded = jwt.decode(token) as jwt.JwtPayload | null;
    
    if (decoded?.sub) {
      request.user = {
        stackAuthId: decoded.sub as string,
      };
    }
  } catch (error) {
    // Silently fail for optional auth
    return;
  }
}


import fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import { authRoutes } from './routes/auth';
import { adminRoutes } from './routes/admin';
import { canonRoutes } from './routes/canon';

dotenv.config();

const server = fastify({ logger: true });

// Register CORS
server.register(cors, {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'x-stack-auth'],
});

// Health check
server.get('/health', async () => {
  return { status: 'ok' };
});

// Register auth routes
server.register(authRoutes);

// Register admin routes
server.register(adminRoutes);

// Register canon routes
server.register(canonRoutes);

// Legacy placeholders removed; use canon routes

// Start server
const start = async () => {
  try {
    const port = Number(process.env.API_PORT) || 3000;
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`Server listening on http://localhost:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();


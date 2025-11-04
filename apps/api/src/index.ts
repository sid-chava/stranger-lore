import fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import { authRoutes } from './routes/auth.js';
import { adminRoutes } from './routes/admin.js';
import { canonRoutes } from './routes/canon.js';

dotenv.config();

const server = fastify({ logger: true });

const normalizeOrigin = (origin?: string | null) =>
  origin ? origin.replace(/\/$/, '') : undefined;

const allowedOrigins = [
  normalizeOrigin(process.env.FRONTEND_URL),
  normalizeOrigin(process.env.ADDITIONAL_FRONTEND_URL),
  'http://localhost:5173',
].filter((origin): origin is string => Boolean(origin));

// Register CORS
server.register(cors, {
  origin: allowedOrigins,
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
    // Prefer Railway/Render/etc. provided PORT, then API_PORT, then 3000 locally
    const port = Number(process.env.PORT) || Number(process.env.API_PORT) || 3000;
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`Server listening on http://localhost:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();

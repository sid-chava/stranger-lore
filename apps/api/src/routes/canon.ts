import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticateUser } from '../middleware/auth.js';
import { adminRoutes } from './admin.js';

const prisma = new PrismaClient();

// Lightweight admin guard reused from admin routes
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
const FolderCreateSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).optional(),
  parentId: z.string().uuid().nullable().optional(),
  description: z.string().max(2000).optional(),
  sortOrder: z.number().int().optional(),
  isFeatured: z.boolean().optional(),
});

const FolderUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  parentId: z.string().uuid().nullable().optional(),
  description: z.string().max(2000).optional(),
  sortOrder: z.number().int().optional(),
  isFeatured: z.boolean().optional(),
});

const PageCreateSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1).optional(),
  folderId: z.string().uuid(),
  markdown: z.string().min(1),
});

const PageUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  folderId: z.string().uuid().optional(),
});

const PageRevisionCreateSchema = z.object({
  markdown: z.string().min(1),
  summary: z.string().max(500).optional(),
});

export async function canonRoutes(fastify: FastifyInstance) {
  const sendError = (reply: any, error: any, status = 500) => {
    const details: any = {
      message: (error && error.message) || 'Internal Server Error',
    };
    if (error && error.code) details.code = error.code; // Prisma error code e.g., P2002
    if (error && error.meta) details.meta = error.meta;
    if (error && error.stack) fastify.log.error(error);
    return reply.code(status).send({ error: details });
  };
  // Canon folders - list (public)
  fastify.get('/api/canon/folders', async (_request, reply) => {
    const folders = await prisma.folder.findMany({
      where: { kind: 'canon' },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: { children: true },
    });
    return { folders };
  });

  // Create folder (admin)
  fastify.post(
    '/api/canon/folders',
    { preHandler: [authenticateUser, requireAdmin] },
    async (request, reply) => {
      try {
        const parsed = FolderCreateSchema.safeParse(request.body);
        if (!parsed.success) return reply.code(400).send({ error: parsed.error.errors });
        const data = parsed.data;

        if (data.parentId) {
          const parent = await prisma.folder.findUnique({ where: { id: data.parentId } });
          if (!parent || parent.kind !== 'canon') return reply.code(400).send({ error: 'Invalid parent folder' });
        }

        const folder = await prisma.folder.create({
          data: {
            name: data.name,
            slug: data.slug ?? data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
            parentId: data.parentId ?? null,
            description: data.description,
            sortOrder: data.sortOrder ?? 0,
            isFeatured: data.isFeatured ?? false,
            kind: 'canon',
          },
        });
        return { folder };
      } catch (error: any) {
        return sendError(reply, error);
      }
    }
  );

  // Update folder (admin)
  fastify.patch(
    '/api/canon/folders/:id',
    { preHandler: [authenticateUser, requireAdmin] },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const parsed = FolderUpdateSchema.safeParse(request.body);
        if (!parsed.success) return reply.code(400).send({ error: parsed.error.errors });

        const existing = await prisma.folder.findUnique({ where: { id } });
        if (!existing || existing.kind !== 'canon') return reply.code(404).send({ error: 'Folder not found' });

        if (parsed.data.parentId) {
          const parent = await prisma.folder.findUnique({ where: { id: parsed.data.parentId } });
          if (!parent || parent.kind !== 'canon') return reply.code(400).send({ error: 'Invalid parent folder' });
        }

        const folder = await prisma.folder.update({
          where: { id },
          data: { ...parsed.data },
        });
        return { folder };
      } catch (error: any) {
        return sendError(reply, error);
      }
    }
  );

  // Delete folder (admin)
  fastify.delete(
    '/api/canon/folders/:id',
    { preHandler: [authenticateUser, requireAdmin] },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const existing = await prisma.folder.findUnique({ where: { id } });
        if (!existing || existing.kind !== 'canon') return reply.code(404).send({ error: 'Folder not found' });

        await prisma.folder.delete({ where: { id } });
        return { success: true };
      } catch (error: any) {
        return sendError(reply, error);
      }
    }
  );

  // Get page (public) - latest revision
  fastify.get('/api/canon/pages/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const page = await prisma.page.findUnique({
      where: { id },
      include: { folder: true, revisions: { orderBy: { version: 'desc' }, take: 1 } },
    });
    if (!page || page.folder.kind !== 'canon') return reply.code(404).send({ error: 'Page not found' });
    const latest = page.revisions[0] || null;
    return { page: { id: page.id, title: page.title, slug: page.slug, folderId: page.folderId, latestRevision: latest } };
  });

  // List pages in a folder (public)
  fastify.get('/api/canon/folders/:id/pages', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const folder = await prisma.folder.findUnique({ where: { id } });
      if (!folder || folder.kind !== 'canon') return reply.code(404).send({ error: 'Folder not found' });
      const pages = await prisma.page.findMany({
        where: { folderId: id },
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true, slug: true, createdAt: true },
      });
      return { pages };
    } catch (error: any) {
      return reply.code(500).send({ error: { message: error?.message || 'Failed to list pages' } });
    }
  });

  // Create page (admin) with first revision
  fastify.post(
    '/api/canon/pages',
    { preHandler: [authenticateUser, requireAdmin] },
    async (request, reply) => {
      try {
        const parsed = PageCreateSchema.safeParse(request.body);
        if (!parsed.success) return reply.code(400).send({ error: parsed.error.errors });
        const { title, slug, folderId, markdown } = parsed.data;

        const folder = await prisma.folder.findUnique({ where: { id: folderId } });
        if (!folder || folder.kind !== 'canon') return reply.code(400).send({ error: 'Invalid folder for canon page' });

        const page = await prisma.$transaction(async (tx: any) => {
          const created = await tx.page.create({
            data: {
              title,
              slug: slug ?? title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
              folderId,
              createdById: null,
              status: 'draft',
            },
          });

          await tx.pageRevision.create({
            data: {
              pageId: created.id,
              content: markdown,
              createdBy: null,
            },
          });

          return created;
        });

        return { page };
      } catch (error: any) {
        return sendError(reply, error);
      }
    }
  );

  // Update page metadata (admin)
  fastify.patch(
    '/api/canon/pages/:id',
    { preHandler: [authenticateUser, requireAdmin] },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const parsed = PageUpdateSchema.safeParse(request.body);
        if (!parsed.success) return reply.code(400).send({ error: parsed.error.errors });

        const page = await prisma.page.findUnique({
          where: { id },
          include: { folder: true },
        });
        if (!page || page.folder.kind !== 'canon') return reply.code(404).send({ error: 'Page not found' });

        if (parsed.data.folderId) {
          const folder = await prisma.folder.findUnique({ where: { id: parsed.data.folderId } });
          if (!folder || folder.kind !== 'canon') return reply.code(400).send({ error: 'Invalid target folder' });
        }

        const updated = await prisma.page.update({ where: { id }, data: { ...parsed.data } });
        return { page: updated };
      } catch (error: any) {
        return sendError(reply, error);
      }
    }
  );

  // Delete page (admin)
  fastify.delete(
    '/api/canon/pages/:id',
    { preHandler: [authenticateUser, requireAdmin] },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const page = await prisma.page.findUnique({ where: { id }, include: { folder: true } });
        if (!page || page.folder.kind !== 'canon') return reply.code(404).send({ error: 'Page not found' });
        await prisma.page.delete({ where: { id } });
        return { success: true };
      } catch (error: any) {
        return sendError(reply, error);
      }
    }
  );

  // Create new revision (admin)
  fastify.post(
    '/api/canon/pages/:id/revisions',
    { preHandler: [authenticateUser, requireAdmin] },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const parsed = PageRevisionCreateSchema.safeParse(request.body);
        if (!parsed.success) return reply.code(400).send({ error: parsed.error.errors });

        const page = await prisma.page.findUnique({ where: { id }, include: { folder: true, revisions: true } });
        if (!page || page.folder.kind !== 'canon') return reply.code(404).send({ error: 'Page not found' });

        const nextVersion = (page.revisions.reduce((max: number, r: any) => Math.max(max, r.version), 0) || 0) + 1;

        const rev = await prisma.pageRevision.create({
          data: {
            pageId: id,
            content: parsed.data.markdown,
            version: nextVersion,
            createdBy: null,
          },
        });
        return { revision: rev };
      } catch (error: any) {
        return sendError(reply, error);
      }
    }
  );
}

# Architecture Plan: Stranger Lore

This document outlines the architecture and technical decisions for the Stranger Lore project.

## Overview

Stranger Lore is a fan-sourced library for all canon and fanon related to Netflix's "Stranger Things". The platform combines wiki-style content management (similar to Fandom.com) with forum-like discussion features (similar to Hacker News).

## Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **TanStack Query** - Data fetching and state management
- **TypeScript** - Type safety

### Backend
- **Node.js** - Runtime environment
- **Fastify** - Web framework (lightweight alternative to Express)
- **Prisma** - Database ORM and migration tool
- **Zod** - Runtime type validation and schema definition

### Database
- **PostgreSQL** (via Neon) - Primary database
- **Prisma Migrations** - Schema versioning and migrations

### Authentication
- **Stack Auth** - Managed authentication service
  - Issues JWTs for API authentication
  - Handles user registration, login, and session management

### Package Management
- **pnpm workspaces** - Monorepo management

## Project Structure

```
stranger-lore/
├── apps/
│   ├── api/                 # Node.js + Fastify backend
│   │   ├── src/
│   │   │   ├── index.ts     # Server entry point
│   │   │   ├── routes/      # API route handlers
│   │   │   ├── middleware/  # Auth & validation middleware
│   │   │   └── lib/         # Utility functions
│   │   └── prisma/
│   │       ├── schema.prisma # Database schema
│   │       └── seed.ts      # Database seed script
│   └── web/                 # React + Vite frontend
│       ├── src/
│       │   ├── pages/       # Page components
│       │   ├── components/  # Reusable UI components
│       │   ├── contexts/    # React contexts (Auth, etc.)
│       │   ├── services/    # API client functions
│       │   └── hooks/       # Custom React hooks
│       └── index.html
├── packages/                # Shared packages (future)
├── docs/                    # Documentation
└── package.json            # Root workspace config
```

## Database Schema

### Core Models

#### Users & Authentication
- **User** - Mirrors Stack Auth user IDs, stores minimal user data
- **Role** - Defines roles (admin, editor, reader)
- **UserRole** - Many-to-many relationship between users and roles

#### Content Hierarchy
- **Folder** - Hierarchical organization of content (supports nested folders via `parentId`)
  - Features: `slug`, `sortOrder`, `isFeatured` for navigation management
- **Page** - Individual pages/content entries
  - Lives within a folder
  - Has a `status` field (draft, published, archived)
  - Stores minimal metadata; actual content in revisions

#### Content Management
- **PageRevision** - Version history for pages
  - Stores `content` as Markdown or JSON
  - Supports version tracking and rollback
- **NavigationConfig** - Controls which folders appear on the homepage
  - Allows admins to customize navigation without changing folder structure

### Key Design Decisions

1. **Adjacency List Pattern** - Folders use `parent_id` for hierarchy, enabling recursive queries with PostgreSQL CTEs
2. **Soft Deletes** - Status-based archiving rather than hard deletes for content recovery
3. **Revision History** - Separate revisions table enables version control and audit trails
4. **Flexible Navigation** - NavigationConfig decouples folder structure from homepage display

## Authentication Flow

### Stack Auth Integration

1. **Frontend**: User authenticates via Stack Auth (redirect to Stack Auth UI)
2. **Stack Auth**: Issues JWT access token with user ID
3. **Frontend**: Stores token (httpOnly cookie via API proxy, or localStorage)
4. **API**: Middleware validates JWT, extracts user ID, loads roles from database
5. **API Routes**: Check `req.user.roles` for authorization (admin/editor permissions)

### Authorization Middleware

```typescript
// Pseudocode for role checking
async function requireRole(role: string) {
  // Validate JWT from Stack Auth
  // Load user roles from UserRole table
  // Check if user has required role
  // Return 403 if unauthorized
}
```

## Content Management Features

### Admin Capabilities

1. **Folder Management**
   - Create/edit/delete folders
   - Organize folder hierarchy
   - Set folder display order

2. **Page Management**
   - Create/edit pages (Markdown or rich text)
   - Organize pages within folders
   - Publish/draft/archive pages
   - View revision history

3. **Navigation Management**
   - Control which folders appear on homepage
   - Reorder folder display
   - Set featured folders

### Editor Experience

- Plain text area with Markdown preview (initially)
- Future: Rich text editor (TipTap/Slate) with structured content storage
- Content stored in `PageRevision` table for version history

## API Design

### RESTful Endpoints

#### Auth
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/callback` - Stack Auth callback handler

#### Folders
- `GET /api/folders` - List all folders (with hierarchy)
- `GET /api/folders/:id` - Get folder details
- `POST /api/folders` - Create folder (admin/editor)
- `PATCH /api/folders/:id` - Update folder (admin/editor)
- `DELETE /api/folders/:id` - Delete folder (admin)

#### Pages
- `GET /api/pages` - List pages (filtered by folder/status)
- `GET /api/pages/:id` - Get page with latest revision
- `POST /api/pages` - Create page (admin/editor)
- `PATCH /api/pages/:id` - Update page (creates new revision)
- `DELETE /api/pages/:id` - Delete page (admin/editor)

#### Admin
- `GET /api/admin/navigation` - Get navigation config
- `PUT /api/admin/navigation` - Update navigation config (admin only)

## Development Workflow

### Database Migrations

1. **Modify Schema**: Edit `apps/api/prisma/schema.prisma`
2. **Create Migration**: `pnpm db:migrate` (creates migration file)
3. **Apply Migration**: Migration auto-applies in dev, manual apply in prod
4. into Prisma Client**: `pnpm db:generate` (regenerates TypeScript types)

### Seeding

- Seed script at `apps/api/prisma/seed.ts`
- Seeds default roles (admin, editor, reader)
- Seeds example root folder
- Run with: `pnpm db:seed`

## Deployment Strategy

### Frontend (Vercel/Netlify)
- Build command: `pnpm --filter web build`
- Deploy static output
- Configure environment variables for API URL

### Backend (Serverless or Container)
- Option 1: Vercel/Netlify Functions (serverless)
- Option 2: Fly.io/Render (containerized Node.js)
- Environment variables: Stack Auth secrets, Neon DATABASE_URL
- Run migrations via CI/CD or manually post-deploy

### Database (Neon)
- Managed PostgreSQL
- Connection pooling enabled
- Separate databases for staging/production

## Future Enhancements

1. **Rich Text Editor** - Replace Markdown with TipTap/Slate for structured content
2. **File Uploads** - Image/document storage (S3 or similar)
3. **Search** - Full-text search with PostgreSQL or external service (Typesense/Algolia)
4. **Comments/Discussions** - Forum-style threaded discussions per page
5. **User Profiles** - Contributor pages, leaderboards
6. **Draft Collaboration** - Real-time editing with optimistic locking
7. **Scheduled Publishing** - Publish content at specific times

## Security Considerations

1. **JWT Validation** - All API endpoints validate Stack Auth JWTs
2. **Role-Based Access Control** - Middleware enforces permissions
3. **SQL Injection** - Prisma ORM prevents SQL injection
4. **Input Validation** - Zod schemas validate all user input
5. **CORS** - Configured to allow only frontend domain
6. **Rate Limiting** - To be implemented for public endpoints

## Performance Optimizations

1. **Database Indexing** - Indexes on frequently queried fields (slug, folderId, status)
2. **Query Optimization** - Use Prisma includes/selects to minimize data transfer
3. **Caching** - Consider Redis for frequently accessed navigation/config
4. **CDN** - Frontend assets served via CDN (Vercel/Netlify handles this)

## Monitoring & Observability

- API logging via Fastify's built-in logger
- Error tracking (Sentry or similar)
- Database query monitoring (Neon dashboard)
- User analytics (future)

---

This architecture provides a solid foundation for building the Stranger Lore platform while remaining flexible enough to accommodate future features and scaling needs.


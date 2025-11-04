# Stranger Lore

A fan project on a mission to become the first-ever 100% fan-sourced library for all canon and fanon related to Netflix's 'Stranger Things'.

## Tech Stack

- **Frontend**: React + Vite
- **Backend**: Node.js + Fastify
- **Database**: PostgreSQL (Neon)
- **Auth**: Stack Auth
- **ORM**: Prisma
- **Package Manager**: pnpm (workspaces)

## Setup

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- PostgreSQL database (Neon recommended)

### Installation

1. Install dependencies:
```bash
pnpm install
```

2. Set up environment variables (see [Neon Setup Guide](./docs/NEON_SETUP.md) for detailed instructions):
   - **Neon Database**: Get connection string from [Neon Console](https://console.neon.tech)
     - Add `DATABASE_URL` to `apps/api/.env`
   - **Stack Auth**: Get project ID from [Stack Auth Dashboard](https://stack-auth.com)
     - Add `STACK_PROJECT_ID` to `apps/api/.env`
     - Add `VITE_STACK_PROJECT_ID` to `apps/web/.env`

3. Generate Prisma client:
```bash
pnpm db:generate
```

4. Run database migrations:
```bash
pnpm db:migrate
```

5. Seed the database (optional):
```bash
pnpm db:seed
```

## Development

Start both frontend and backend in development mode:
```bash
pnpm dev
```

This will start:
- Frontend dev server on `http://localhost:5173`
- API server on `http://localhost:3000`

## Database Commands

- `pnpm db:migrate` - Run Prisma migrations
- `pnpm db:generate` - Generate Prisma client
- `pnpm db:studio` - Open Prisma Studio (database GUI)
- `pnpm db:seed` - Seed the database with initial data
- `pnpm db:reset` - Reset database (run migrations + seed)

## Stack Auth Setup

1. **Create a Stack Auth account** at [https://stack-auth.com](https://stack-auth.com)
2. **Create a new project** in the dashboard
3. **Copy your Project ID** from the dashboard
4. **Set environment variables**:
   ```bash
   # In your .env file:
   VITE_STACK_PROJECT_ID=your_project_id_here
   STACK_PROJECT_ID=your_project_id_here
   ```
5. **Configure redirect URLs** in Stack Auth dashboard:
   - Add `http://localhost.local:5173` (or `http://127.0.0.1.local:5173`) as an allowed redirect URL
   - **Important**: Access your app at `http://localhost.local:5173` instead of `http://localhost:5173`
   - See [Redirect URL Setup Guide](./docs/STACK_AUTH_REDIRECT_SETUP.md) for details
   - Add your production URL when deploying

## Authentication

The app uses Stack Auth for authentication:
- Users can sign up/sign in via the "Log In / Sign Up" button in the header
- JWT tokens are stored in localStorage on the frontend
- Backend API routes validate JWTs and create users in the database on first login
- User roles are managed in the database (admin, editor, reader)

## Project Structure

```
stranger-lore/
├── apps/
│   ├── api/                    # Node.js + Fastify API
│   │   ├── src/
│   │   │   ├── routes/         # API route handlers (auth, folders, pages)
│   │   │   ├── middleware/     # Auth middleware (JWT validation)
│   │   │   └── index.ts        # Server entry point
│   │   └── prisma/             # Database schema and migrations
│   └── web/                    # React + Vite frontend
│       ├── src/
│       │   ├── pages/          # Page components
│       │   ├── contexts/       # Auth context
│       │   ├── lib/            # Stack Auth client
│       │   └── services/       # API client functions
│       └── public/             # Static assets
├── packages/                   # Shared packages (future)
└── docs/                      # Documentation
```


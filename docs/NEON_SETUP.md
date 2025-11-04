# Connecting Stack Auth to Neon Database

## Architecture Overview

**Stack Auth** and **Neon** don't directly connect to each other. Here's how they work together:

1. **Stack Auth** → Handles user authentication (login/signup), issues JWT tokens
2. **Your Backend API** → Validates JWTs from Stack Auth, connects to Neon database
3. **Neon Database** → Stores your application data (users, folders, pages, etc.)

When a user logs in via Stack Auth:
- Stack Auth authenticates them and returns a JWT token
- Your backend validates the JWT
- Your backend creates/updates the user record in Neon

## Option 1: Custom Integration (Current Setup)

This is what we've implemented. You control the user schema in your database.

### Step 1: Get Neon Connection String

1. Go to [Neon Console](https://console.neon.tech)
2. Create a new project (or use existing)
3. Go to your project dashboard
4. Click on "Connection Details" or find your connection string
5. Copy the connection string (it looks like):
   ```
   postgresql://username:password@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require
   ```

### Step 2: Set Up Environment Variables

Create a `.env` file in `apps/api/` directory:

```bash
# Neon Database Connection
DATABASE_URL="postgresql://username:password@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require"

# Stack Auth (same project ID for both)
STACK_PROJECT_ID="your_stack_project_id"
FRONTEND_URL="http://localhost:5173"
API_PORT=3000
```

Create a `.env` file in `apps/web/` directory (or root):

```bash
# Stack Auth
VITE_STACK_PROJECT_ID="your_stack_project_id"

# API URL
VITE_API_URL="http://localhost:3000"
```

### Step 3: Run Database Migrations

```bash
# Generate Prisma client
pnpm db:generate

# Run migrations to create tables in Neon
pnpm db:migrate

# Optional: Seed initial data (roles, root folder)
pnpm db:seed
```

### Step 4: Verify Connection

```bash
# Start the API server
cd apps/api
pnpm dev

# In another terminal, check if tables were created
pnpm db:studio
```

This opens Prisma Studio where you can see your Neon database tables.

## Option 2: Neon Auth (Built-in Integration)

Neon offers a built-in Stack Auth integration called "Neon Auth" that automatically syncs users.

### Setup:

1. **Enable Neon Auth**:
   - Go to Neon Console → Your Project → **Auth** section
   - Click **Enable Neon Auth**
   - This provisions a Stack Auth project managed by Neon

2. **Get Credentials**:
   - Go to **Configuration** tab
   - Copy the environment variables:
     - `NEXT_PUBLIC_STACK_PROJECT_ID`
     - `STACK_SECRET_SERVER_KEY`
     - `DATABASE_URL`

3. **User Sync**:
   - Neon creates a `neon_auth.users_sync` table automatically
   - Users are synced automatically when they authenticate

**Note**: This creates a separate `neon_auth` schema. If you want to use this, you'd need to modify your Prisma schema to reference `neon_auth.users_sync` instead of your custom `users` table.

## Recommended: Option 1 (Custom Integration)

We recommend Option 1 because:
- ✅ Full control over user schema
- ✅ Can add custom fields (roles, preferences, etc.)
- ✅ Aligns with your existing Prisma schema
- ✅ No dependency on Neon-specific features

## Troubleshooting

### Connection Issues

If you get connection errors:

1. **Check SSL Mode**: Neon requires SSL. Make sure your connection string includes `?sslmode=require`
2. **Check IP Allowlist**: Neon might have IP restrictions. Go to Neon Console → Settings → IP Allowlist
3. **Connection Pooling**: For serverless environments, use Neon's connection pooling:
   ```
   postgresql://username:password@ep-xxx-pooler.us-east-2.aws.neon.tech/dbname?sslmode=require
   ```
   (Note the `-pooler` in the hostname)

### Migration Issues

If migrations fail:

```bash
# Reset and try again
pnpm db:reset

# Or check migration status
cd apps/api
npx prisma migrate status
```

## Quick Start Checklist

- [ ] Created Neon project
- [ ] Copied DATABASE_URL from Neon Console
- [ ] Created `.env` files with DATABASE_URL and Stack Auth credentials
- [ ] Ran `pnpm db:generate`
- [ ] Ran `pnpm db:migrate`
- [ ] Verified tables exist in Neon (via Prisma Studio or Neon Console)
- [ ] Started API server successfully

Once all checkboxes are done, your Stack Auth ↔ Backend ↔ Neon connection is complete!


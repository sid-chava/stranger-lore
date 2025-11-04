# Role Management Guide

## Overview

Roles are managed in your database and assigned to users. There are three default roles:
- **admin** - Full access to create folders, pages, and manage navigation
- **editor** - Can create and edit pages within assigned folders
- **reader** - Read-only access

## How Roles Work

1. **Stack Auth** handles authentication (login/signup)
2. **Your database** stores user roles via the `UserRole` table
3. **API routes** check roles for authorization

## Assigning Roles

### Option 1: Using Prisma Studio (Easiest for First Admin)

1. **Start Prisma Studio**:
   ```bash
   pnpm db:studio
   ```

2. **Find your user**:
   - Go to `User` table
   - Find your user by `stackAuthId` (from Stack Auth)
   - Note the user's `id` (UUID)

3. **Get role ID**:
   - Go to `Role` table
   - Find the role you want (e.g., "admin")
   - Note the role's `id` (UUID)

4. **Create UserRole**:
   - Go to `UserRole` table
   - Click "Add record"
   - Set `userId` to your user's UUID
   - Set `roleId` to the role's UUID (e.g., admin)
   - Save

### Option 2: Using Admin API (After First Admin is Set)

Once you have at least one admin user, you can use the admin API:

**Get all users:**
```bash
GET /api/admin/users
Authorization: Bearer <your_jwt_token>
```

**Assign a role:**
```bash
POST /api/admin/users/:userId/roles
Authorization: Bearer <your_jwt_token>
Content-Type: application/json

{
  "roleName": "admin"  // or "editor" or "reader"
}
```

**Remove a role:**
```bash
DELETE /api/admin/users/:userId/roles/:roleName
Authorization: Bearer <your_jwt_token>
```

### Option 3: Direct SQL Query

Connect to your Neon database and run:

```sql
-- First, get your user ID and role ID
SELECT id, stack_auth_id, email FROM users WHERE stack_auth_id = 'your_stack_auth_user_id';

SELECT id, name FROM roles WHERE name = 'admin';

-- Then assign the role
INSERT INTO user_roles (id, user_id, role_id, created_at)
VALUES (
  gen_random_uuid(),
  'your_user_id_here',
  'your_role_id_here',
  NOW()
);
```

## Setting Up Your First Admin

Since you need an admin to use the admin API, here's how to set up the first admin:

1. **Log in** via Stack Auth (this creates your user in the database)
2. **Get your Stack Auth ID** from the JWT token or Stack Auth dashboard
3. **Use Prisma Studio** (Option 1 above) to assign yourself the "admin" role
4. **Or use SQL** (Option 3) if you prefer

## Checking User Roles

Users can check their own roles via:
```bash
GET /api/auth/me
Authorization: Bearer <your_jwt_token>
```

Returns:
```json
{
  "id": "user-uuid",
  "stackAuthId": "stack-auth-id",
  "email": "user@example.com",
  "name": "User Name",
  "roles": ["admin", "editor"]
}
```

## Role-Based Access Control

In your API routes, check roles like this:

```typescript
// Check if user has admin role
const user = await prisma.user.findUnique({
  where: { stackAuthId: request.user.stackAuthId },
  include: {
    userRoles: {
      include: { role: true }
    }
  }
});

const hasAdminRole = user?.userRoles.some(ur => ur.role.name === 'admin');
if (!hasAdminRole) {
  return reply.code(403).send({ error: 'Admin access required' });
}
```

## Default Roles

The seed script creates these roles:
- `admin` - Full access
- `editor` - Can create/edit pages
- `reader` - Read-only

You can create additional roles by inserting into the `roles` table.


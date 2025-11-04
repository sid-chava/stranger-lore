import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create default roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      description: 'Full access to create folders, pages, and manage navigation',
    },
  });

  const editorRole = await prisma.role.upsert({
    where: { name: 'editor' },
    update: {},
    create: {
      name: 'editor',
      description: 'Can create and edit pages within assigned folders',
    },
  });

  const readerRole = await prisma.role.upsert({
    where: { name: 'reader' },
    update: {},
    create: {
      name: 'reader',
      description: 'Read-only access',
    },
  });

  console.log('Seeded roles:', { adminRole, editorRole, readerRole });

  // Create a root folder example
  const rootFolder = await prisma.folder.upsert({
    where: { slug: 'root' },
    update: {},
    create: {
      name: 'Root',
      slug: 'root',
      description: 'Root folder for all content',
      kind: 'canon',
      isFeatured: true,
      sortOrder: 0,
    },
  });

  console.log('Seeded root folder:', rootFolder);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


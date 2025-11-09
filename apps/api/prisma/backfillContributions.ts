import { PrismaClient, ContributionType } from '@prisma/client';

const prisma = new PrismaClient();

async function backfillApprovals() {
  const theories = await prisma.theory.findMany({
    where: { status: 'approved' },
    select: { id: true, createdById: true },
  });

  let created = 0;
  for (const theory of theories) {
    if (!theory.createdById) continue;

    await prisma.contribution.upsert({
      where: {
        userId_theoryId_type: {
          userId: theory.createdById,
          theoryId: theory.id,
          type: ContributionType.theory_approved,
        },
      },
      update: {},
      create: {
        userId: theory.createdById,
        theoryId: theory.id,
        type: ContributionType.theory_approved,
      },
    });
    created += 1;
  }

  return created;
}

async function backfillVotes() {
  const votes = await prisma.vote.findMany({
    select: { userId: true, theoryId: true },
  });

  let created = 0;
  for (const vote of votes) {
    await prisma.contribution.upsert({
      where: {
        userId_theoryId_type: {
          userId: vote.userId,
          theoryId: vote.theoryId,
          type: ContributionType.theory_vote,
        },
      },
      update: {},
      create: {
        userId: vote.userId,
        theoryId: vote.theoryId,
        type: ContributionType.theory_vote,
      },
    });
    created += 1;
  }

  return created;
}

async function main() {
  console.log('Starting contribution backfill...');
  const approvals = await backfillApprovals();
  console.log(`Ensured ${approvals} approval contributions.`);
  const votes = await backfillVotes();
  console.log(`Ensured ${votes} vote contributions.`);
  console.log('Backfill completed.');
}

main()
  .catch((error) => {
    console.error('Backfill failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

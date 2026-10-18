require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();

  console.log('\n=== PRISMA CLIENT READ TEST ===');

  // Count users
  const userCount = await prisma.user.count();
  console.log('User count:', userCount);

  // Count companies
  const companyCount = await prisma.company.count();
  console.log('Company count:', companyCount);

  // Count drives
  const driveCount = await prisma.placementDrive.count();
  console.log('PlacementDrive count:', driveCount);

  // Try creating a test user in a transaction (rolled back)
  const testUser = await prisma.user.create({
    data: {
      email: 'verify@test.recruitx.dev',
      passwordHash: 'verify_hash',
      name: 'Verify Test',
      role: 'STUDENT',
    },
  });
  console.log('Created test user:', testUser.id, testUser.email);

  // Clean up the test user
  await prisma.user.delete({
    where: { id: testUser.id },
  });
  console.log('Deleted test user.');

  console.log('\nPrisma Client read/write test: PASSED');

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Verification failed:', e.message);
  process.exit(1);
});
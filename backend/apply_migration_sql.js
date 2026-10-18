const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  const sql = fs.readFileSync('./prisma/migrations/20261017_init/migration.sql', 'utf8');

  // Remove comment lines, then split into individual statements
  const cleanedSql = sql
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('--'))
    .join('\n');

  const statements = cleanedSql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  console.log(`Executing ${statements.length} SQL statements...`);

  for (let i = 0; i < statements.length; i++) {
    try {
      await prisma.$queryRawUnsafe(statements[i] + ';');
      if ((i + 1) % 10 === 0) console.log(`  Executed ${i + 1}/${statements.length} statements`);
    } catch (e) {
      console.error(`Statement ${i + 1} failed:`, e.message);
      console.error('Statement:', statements[i].substring(0, 200));
      throw e;
    }
  }

  console.log('All statements executed successfully.');

  // Verify tables were created in recruitx schema
  const tables = await prisma.$queryRawUnsafe(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'recruitx' ORDER BY table_name;`
  );
  console.log('\n=== Tables in recruitx schema ===');
  console.table(tables);

  // Verify migration is recorded
  const migrations = await prisma.$queryRawUnsafe(
    `SELECT migration_name FROM recruitx._prisma_migrations ORDER BY started_at;`
  );
  console.log('\n=== Applied migrations ===');
  console.table(migrations);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Failed:', e.message);
  process.exit(1);
});
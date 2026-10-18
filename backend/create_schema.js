require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  console.log('Creating recruitx schema...');
  await prisma.$queryRawUnsafe('CREATE SCHEMA IF NOT EXISTS recruitx;');
  console.log('Schema recruitx created.');
  const schemas = await prisma.$queryRawUnsafe("SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'recruitx';");
  console.table(schemas);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Failed:', e.message);
  process.exit(1);
});
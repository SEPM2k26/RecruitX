const { PrismaClient } = require('@prisma/client');
const config = require('../config/config');

// Build connection URL from config (same logic as pg pool)
const buildPrismaUrl = () => {
  // Use the same connection as pg pool (config.db.url) since it's working
  if (config.db.url) {
    // Use the cleaned URL from config (already handles SSL stripping)
    return config.db.url;
  }
  // Fallback to individual params
  const { host, port, name, user, password, ssl } = config.db;
  const sslParam = ssl ? '?sslmode=require' : '';
  return `postgresql://${user}:${password}@${host}:${port}/${name}${sslParam}`;
};

const prismaUrl = buildPrismaUrl();

// Singleton Prisma Client to avoid multiple instances in development
// (especially with hot-reloading). Follows existing CommonJS conventions.
let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: prismaUrl
      }
    }
  });
} else {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      datasources: {
        db: {
          url: prismaUrl
        }
      }
    });
  }
  prisma = global.__prisma;
}

module.exports = prisma;
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = (process.env.DATABASE_URL || '').trim();

if (!connectionString) {
  console.error('❌ DATABASE_URL is missing from process.env');
  process.exit(1);
}

const masked = connectionString.replace(/:([^:@]+)@/, ':****@');
console.log(`🔌 DB connected: ${masked.substring(0, 50)}...`);

// Standard pg Pool — works perfectly with Neon over TCP
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

module.exports = prisma;

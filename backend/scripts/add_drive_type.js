require('dotenv').config();
const { Pool } = require('pg');
const raw = process.env.DATABASE_URL;
const clean = raw.replace(/([?&])sslmode=[^&]*/g, '$1').replace(/[?&]$/, '');
const p = new Pool({ connectionString: clean, ssl: { rejectUnauthorized: false } });

async function run() {
  await p.query(`ALTER TABLE public.placement_drives ADD COLUMN IF NOT EXISTS drive_type VARCHAR(20) DEFAULT 'placement' NOT NULL`);
  console.log('drive_type column added (or already exists)');
  await p.end();
}
run().catch(e => { console.error(e.message); process.exit(1); });

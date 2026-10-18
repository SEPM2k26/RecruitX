/**
 * ensure_recruiters.js — smallest SAFE ADDITIVE migration.
 *
 * Creates public.recruiters IF NOT EXISTS (new Prisma model; no existing
 * table is touched) and upserts two development recruiter accounts linked to
 * whatever companies already exist in public.companies.
 *
 * - Never drops, truncates, or alters existing tables/columns.
 * - Idempotent: safe to rerun.
 * - Prints no credentials or connection strings.
 */
require('dotenv').config();
const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');

const DDL = `
CREATE TABLE IF NOT EXISTS public.recruiters (
  id varchar(100) PRIMARY KEY,
  name varchar(255) NOT NULL,
  email varchar(255) NOT NULL,
  password varchar(255) NOT NULL,
  role varchar(50) NOT NULL DEFAULT 'recruiter',
  company_id varchar(100) NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  job_title varchar(255),
  is_primary_contact boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS recruiters_email_key ON public.recruiters (email);
CREATE INDEX IF NOT EXISTS recruiters_company_id_idx ON public.recruiters (company_id);
`;

async function main() {
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL / DIRECT_URL missing from environment');

  // Newer pg treats sslmode=require as verify-full, which breaks behind
  // proxies with self-signed chains. Strip it and set ssl explicitly.
  const cleanUrl = url.replace(/([?&])sslmode=[^&]*/g, '$1').replace(/[?&]$/, '');
  const client = new Client({
    connectionString: cleanUrl,
    ssl: url.includes('sslmode=disable') ? false : { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    await client.query('BEGIN');
    await client.query(DDL);

    const { rows: companies } = await client.query(
      'SELECT id, name FROM public.companies ORDER BY created_at ASC NULLS LAST, id ASC'
    );
    if (companies.length === 0) {
      throw new Error('public.companies is empty — cannot link recruiters to a company.');
    }
    const pick = (re) => companies.find((c) => re.test(c.name)) || companies[0];
    const assignments = [
      {
        email: 'recruiter.techcorp@recruitx.dev',
        name: 'TechCorp Recruiter',
        password: 'dev_recruiter_123',
        jobTitle: 'Campus Hiring Lead',
        company: pick(/tech/i),
        primary: true,
      },
      {
        email: 'recruiter.finsolve@recruitx.dev',
        name: 'FinSolve Recruiter',
        password: 'dev_recruiter_456',
        jobTitle: 'Talent Acquisition',
        company: pick(/fin/i),
        primary: true,
      },
    ];

    for (const r of assignments) {
      const hash = await bcrypt.hash(r.password, 10);
      await client.query(
        `INSERT INTO public.recruiters
           (id, name, email, password, role, company_id, job_title, is_primary_contact, is_active)
         VALUES ($1, $2, $3, $4, 'recruiter', $5, $6, $7, true)
         ON CONFLICT (email) DO UPDATE SET
           name = EXCLUDED.name,
           company_id = EXCLUDED.company_id,
           job_title = EXCLUDED.job_title,
           updated_at = now()`,
        [`rec-${randomUUID().slice(0, 8)}`, r.name, r.email, hash, r.company.id, r.jobTitle, r.primary]
      );
      console.log(`  recruiter ready: ${r.email} -> company "${r.company.name}" (${r.company.id})`);
    }

    await client.query('COMMIT');
    const { rows } = await client.query('SELECT count(*)::int AS n FROM public.recruiters');
    console.log(`OK: public.recruiters ready (${rows[0].n} accounts).`);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('FAILED:', err.message);
  process.exit(1);
});

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

// ═══════════════════════════════════════════════════════════════════════════
// READ-ONLY database diagnosis. Executes only SELECT / COUNT / catalog
// queries. Never prints connection strings or credentials.
// ═══════════════════════════════════════════════════════════════════════════

const SYSTEM_SCHEMAS = ['pg_catalog', 'information_schema', 'pg_toast', 'pg_temp'];
const NOT_SYS = SYSTEM_SCHEMAS.map((s) => `'${s}'`).join(',');

async function main() {
  const prisma = new PrismaClient();
  const q = (sql) => prisma.$queryRawUnsafe(sql);
  const section = (title) => console.log(`\n=== ${title} ===`);
  const safe = async (label, fn) => {
    try {
      return await fn();
    } catch (e) {
      console.log(`${label}: ERROR — ${e.message.split('\n')[0]}`);
      return null;
    }
  };

  section('SESSION');
  console.table(
    await q(`SELECT current_database() AS db, current_user AS role, current_setting('search_path') AS search_path;`),
  );

  section('SCHEMAS');
  console.table(
    await q(`SELECT nspname AS schema FROM pg_namespace WHERE nspname NOT IN (${NOT_SYS}) ORDER BY nspname;`),
  );

  section('TABLES (all schemas, with row estimates)');
  console.table(
    await q(`
      SELECT c.relnamespace::regnamespace::text AS schema,
             c.relname AS relation,
             CASE c.relkind WHEN 'r' THEN 'table' WHEN 'p' THEN 'partitioned' WHEN 'v' THEN 'view' WHEN 'm' THEN 'matview' ELSE c.relkind::text END AS kind,
             c.reltuples::bigint AS est_rows
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname NOT IN (${NOT_SYS})
        AND c.relkind IN ('r', 'p', 'v', 'm')
      ORDER BY 1, 2;`),
  );

  for (const schema of ['public', 'recruitx']) {
    section(`COLUMNS — schema "${schema}"`);
    const cols = await safe('columns query', () =>
      q(`
        SELECT table_name, ordinal_position AS pos, column_name, data_type,
               is_nullable AS nullable, column_default,
               character_maximum_length AS max_len
        FROM information_schema.columns
        WHERE table_schema = '${schema}'
          AND table_name <> '_prisma_migrations'
        ORDER BY table_name, ordinal_position;`),
    );
    if (cols && cols.length) console.table(cols); else console.log('(none)');
  }


  for (const schema of ['public', 'recruitx']) {
    section(`CONSTRAINTS & INDEXES — schema "${schema}"`);
    const kc = await safe('constraints', () =>
      q(`
        SELECT conrelid::regclass::text AS relation, conname AS name, contype AS type,
               pg_get_constraintdef(oid) AS definition
        FROM pg_constraint
        WHERE connamespace = '${schema}'::regnamespace
        ORDER BY 1, 3, 2;`),
    );
    if (kc && kc.length) console.table(kc); else console.log('(none)');

    const ix = await safe('indexes', () =>
      q(`SELECT tablename, indexname, indexdef FROM pg_indexes
         WHERE schemaname = '${schema}' ORDER BY tablename, indexname;`),
    );
    if (ix && ix.length) console.table(ix); else console.log('(none)');
  }

  section('ENUM TYPES');
  const enums = await safe('enums', () =>
    q(`
      SELECT n.nspname AS schema, t.typname AS enum_name, e.enumlabel AS value, e.enumsortorder AS ord
      FROM pg_type t
      JOIN pg_enum e ON e.enumtypid = t.oid
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname NOT IN (${NOT_SYS})
      ORDER BY 1, 2, 4;`),
  );
  if (enums && enums.length) console.table(enums); else console.log('(none)');

  for (const schema of ['public', 'recruitx']) {
    section(`_prisma_migrations — schema "${schema}"`);
    const exists = await safe('exists check', () =>
      q(`SELECT to_regclass('${schema}._prisma_migrations')::text AS reg;`),
    );
    if (!exists || !exists[0].reg) { console.log('does not exist'); continue; }
    const rows = await safe('rows', () =>
      q(`
        SELECT migration_name, started_at, finished_at, rolled_back_at, applied_steps_count
        FROM "${schema}"._prisma_migrations ORDER BY started_at;`),
    );
    if (rows && rows.length) console.table(rows); else console.log('(exists but empty)');
  }

  section('TRIGGERS');
  console.table(
    await q(`
      SELECT c.relnamespace::regnamespace::text AS schema, c.relname AS table_name,
             t.tgname AS trigger_name, pg_get_triggerdef(t.oid) AS definition
      FROM pg_trigger t
      JOIN pg_class c ON c.oid = t.tgrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE NOT t.tgisinternal AND n.nspname NOT IN (${NOT_SYS})
      ORDER BY 1, 2, 3;`),
  );

  section('TRIGGER FN — create_student_profile_for_auth_user');
  const fn = await safe('function body', () =>
    q(`SELECT pg_get_functiondef(p.oid) AS body
       FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
       WHERE n.nspname = 'public' AND p.proname = 'create_student_profile_for_auth_user';`),
  );
  if (fn && fn.length) console.log(fn[0].body); else console.log('(not found)');


  section('RLS — enabled tables (non-system schemas)');
  console.table(
    await q(`
      SELECT n.nspname AS schema, c.relname AS table_name
      FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname NOT IN (${NOT_SYS}) AND c.relkind = 'r' AND c.relrowsecurity
      ORDER BY 1, 2;`),
  );
  section('RLS — policies');
  const policies = await safe('policies', () =>
    q(`
      SELECT schemaname, tablename, policyname, roles::text[] AS roles, cmd, qual, with_check
      FROM pg_policies WHERE schemaname NOT IN (${NOT_SYS})
      ORDER BY 1, 2, 3;`),
  );
  if (policies && policies.length) console.table(policies); else console.log('(none)');

  section('SUPABASE AUTH (counts only — no PII)');
  const authCount = await safe('auth.users count', () =>
    q(`SELECT COUNT(*)::int AS auth_users FROM auth.users;`),
  );
  if (authCount) console.table(authCount);

  for (const schema of ['public', 'recruitx']) {
    section(`ROW COUNTS — schema "${schema}"`);
    const tables = await safe('table list', () =>
      q(`
        SELECT c.relname AS t
        FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = '${schema}' AND c.relkind = 'r' AND c.relname <> '_prisma_migrations'
        ORDER BY 1;`),
    );
    if (!tables || !tables.length) { console.log('(no tables)'); continue; }
    for (const { t } of tables) {
      const r = await safe(`count ${schema}.${t}`, () =>
        q(`SELECT COUNT(*)::int AS n FROM "${schema}"."${t}";`),
      );
      console.log(`${schema}.${t}: ${r ? r[0].n : 'ERROR'} rows`);
    }
  }

  section('COMPACT COLUMN MAP — public tables');
  const cmap = await safe('compact columns', () =>
    q(`
      SELECT c.relname AS table_name,
             string_agg(a.attname || ':' || format_type(a.atttypid, a.atttypmod) ||
                       CASE WHEN a.attnotnull THEN '!' ELSE '' END, ', '
                       ORDER BY a.attnum) AS columns
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped
      WHERE n.nspname = 'public' AND c.relkind = 'r'
      GROUP BY c.relname ORDER BY c.relname;`),
  );
  if (cmap) for (const r of cmap) console.log(`[${r.table_name}] ${r.columns}`);

  section('COLUMN DEFAULTS — public tables');
  const defs = await safe('defaults', () =>
    q(`
      SELECT table_name, column_name, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND column_default IS NOT NULL
      ORDER BY table_name, ordinal_position;`),
  );
  if (defs) for (const d of defs) console.log(`${d.table_name}.${d.column_name} DEFAULT ${d.column_default} (null=${d.is_nullable})`);

  section('DISTINCT STATUS VALUES (read-only)');
  for (const [t, c] of [['applications', 'status'], ['interviews', 'status'], ['interviews', 'result'], ['placement_drives', 'status'], ['trainings', 'status'], ['notifications', 'type'], ['students', 'role'], ['admins', 'role']]) {
    const rows = await safe(`${t}.${c}`, () =>
      q(`SELECT ${c} AS v, COUNT(*)::int AS n FROM public.${t} GROUP BY ${c} ORDER BY n DESC;`),
    );
    console.log(`${t}.${c}: ${rows ? rows.map((r) => `${JSON.stringify(r.v)}(${r.n})`).join(', ') : 'ERROR'}`);
  }

  section('ID PATTERNS (non-PII)');
  const ids = await safe('id samples', () =>
    q(`
      SELECT 'students' AS t, id FROM public.students
      UNION ALL SELECT 'applications', id FROM public.applications
      UNION ALL SELECT 'placement_drives', id FROM public.placement_drives
      UNION ALL SELECT 'companies', id FROM public.companies
      LIMIT 30;`),
  );
  if (ids) for (const r of ids) console.log(`${r.t}: ${r.t === 'students' || r.t === 'applications' ? r.id : r.id}`);

  section('EXTENSIONS');
  console.table(await q(`SELECT extname, extversion FROM pg_extension ORDER BY extname;`));

  await prisma.$disconnect();
  console.log('\nDiagnosis complete (read-only).');
}

main().catch((e) => {
  console.error('Diagnostic failed:', e.message);
  process.exit(1);
});
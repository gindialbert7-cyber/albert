#!/usr/bin/env node
/**
 * scripts/verify-schema.ts
 *
 * Inspect / verify the live Supabase schema after `supabase db push`.
 * Reads SUPABASE_URL from constants/Config.ts and the service role key
 * from process.env.SUPABASE_SERVICE_ROLE_KEY.
 *
 * Modes:
 *   (no args)               Run the full preset audit (13 tables, 5 promo
 *                           codes, 2 storage buckets). Exit non-zero if
 *                           anything is missing.
 *   --query "<SQL>"         Run a single SQL SELECT and print the rows.
 *
 * Usage:
 *   export SUPABASE_SERVICE_ROLE_KEY=eyJ...
 *   npm run verify-schema
 *   npm run verify-schema -- --query "SELECT id, title FROM books WHERE is_published = true ORDER BY title;"
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Config } from '../constants/Config';

// ─── Args ──────────────────────────────────────────────────────────────────────

const argv = process.argv.slice(2);
let customQuery: string | null = null;
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--query') {
    customQuery = argv[++i] ?? null;
  }
}

// ─── Env ───────────────────────────────────────────────────────────────────────

const SUPABASE_URL              = Config.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env['SUPABASE_SERVICE_ROLE_KEY'];

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('✗ SUPABASE_SERVICE_ROLE_KEY is not set.');
  console.error('  Get it from Supabase Dashboard → Settings → API → service_role key.');
  console.error('  Then run: export SUPABASE_SERVICE_ROLE_KEY=eyJ... (or set it for this shell)');
  process.exit(1);
}

const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── Preset audit ──────────────────────────────────────────────────────────────

const EXPECTED_TABLES = [
  'app_settings',
  'audio_clips',
  'bookmarks',
  'books',
  'chapters',
  'highlights',
  'profiles',
  'promo_codes',
  'promo_redemptions',
  'push_notifications',
  'push_tokens',
  'reading_positions',
  'word_notes',
];

const EXPECTED_PROMO_CODES = [
  'ALBERT30',
  'EDUCATOR50',
  'LAUNCH2026',
  'RABBINATE',
  'SHAVUOT2026',
];

const EXPECTED_BUCKETS = ['books', 'audio'];

async function listPublicTables(): Promise<string[]> {
  // Probe each expected table — if a select against it errors with 42P01
  // (undefined table), it doesn't exist.
  const present: string[] = [];
  for (const table of EXPECTED_TABLES) {
    const { error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    if (!error) {
      present.push(table);
    } else if ((error as { code?: string }).code !== '42P01') {
      // RLS denials and similar still mean the table exists.
      present.push(table);
    }
  }
  return present;
}

async function listPromoCodes(): Promise<string[]> {
  const { data, error } = await supabase.from('promo_codes').select('code');
  if (error) {
    console.error(`✗ promo_codes select failed: ${error.message}`);
    return [];
  }
  return (data ?? []).map(r => (r as { code: string }).code);
}

async function listBuckets(): Promise<{ name: string; public: boolean }[]> {
  const { data, error } = await supabase.storage.listBuckets();
  if (error) {
    console.error(`✗ listBuckets failed: ${error.message}`);
    return [];
  }
  return (data ?? []).map(b => ({ name: b.name, public: Boolean(b.public) }));
}

async function runPresetAudit() {
  let ok = true;

  // Tables
  console.log('\n── Tables ──');
  const presentTables = await listPublicTables();
  for (const t of EXPECTED_TABLES) {
    if (presentTables.includes(t)) {
      console.log(`  ✓ ${t}`);
    } else {
      console.log(`  ✗ ${t}  (missing)`);
      ok = false;
    }
  }

  // Promo codes
  console.log('\n── Seed promo codes ──');
  const codes = await listPromoCodes();
  for (const code of EXPECTED_PROMO_CODES) {
    if (codes.includes(code)) {
      console.log(`  ✓ ${code}`);
    } else {
      console.log(`  ✗ ${code}  (missing)`);
      ok = false;
    }
  }

  // Buckets
  console.log('\n── Storage buckets ──');
  const buckets = await listBuckets();
  for (const expected of EXPECTED_BUCKETS) {
    const b = buckets.find(x => x.name === expected);
    if (!b) {
      console.log(`  ✗ ${expected}  (missing)`);
      ok = false;
    } else if (!b.public) {
      console.log(`  ⚠ ${expected}  (exists but not public)`);
      ok = false;
    } else {
      console.log(`  ✓ ${expected}  (public)`);
    }
  }

  console.log(ok ? '\n✓ Schema looks correct.\n' : '\n✗ Schema has issues — see above.\n');
  process.exit(ok ? 0 : 1);
}

// ─── Custom query mode ────────────────────────────────────────────────────────
//
// We don't have a generic "execute raw SQL" endpoint via @supabase/supabase-js,
// so this mode handles a small set of known patterns: `SELECT ... FROM <table>`
// and pipes the result through PostgREST. Anything more complex should be run
// from the Supabase SQL Editor.

async function runCustomQuery(sql: string) {
  const trimmed = sql.trim().replace(/;$/, '');
  const m = trimmed.match(/^SELECT\s+(.+?)\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+?))?(?:\s+ORDER BY\s+(.+?))?(?:\s+LIMIT\s+(\d+))?$/i);

  if (!m) {
    console.error('✗ verify-schema --query only supports simple SELECT … FROM <table> [WHERE …] [ORDER BY …] [LIMIT N]');
    console.error('  For anything more complex, paste the query into the Supabase SQL Editor.');
    process.exit(1);
  }

  const [, columns, table, whereClause, orderClause, limitClause] = m;
  const wantedCols = columns!.trim() === '*' ? '*' : columns!.split(',').map(s => s.trim()).join(',');

  let q = supabase.from(table!).select(wantedCols);
  // PostgREST-friendly WHERE: only support `col = 'value'` or `col = true/false`
  if (whereClause) {
    const w = whereClause.match(/^(\w+)\s*=\s*(?:'([^']*)'|(true|false|\d+))$/i);
    if (!w) {
      console.error(`✗ WHERE clause too complex for PostgREST shim: ${whereClause}`);
      process.exit(1);
    }
    const [, col, str, lit] = w;
    const val = str !== undefined ? str : (lit === 'true' ? true : lit === 'false' ? false : Number(lit));
    q = q.eq(col!, val as never);
  }
  if (orderClause) {
    const o = orderClause.match(/^(\w+)(?:\s+(ASC|DESC))?$/i);
    if (o) q = q.order(o[1]!, { ascending: (o[2] ?? 'ASC').toUpperCase() === 'ASC' });
  }
  if (limitClause) q = q.limit(Number(limitClause));

  const { data, error } = await q;
  if (error) {
    console.error(`✗ Query failed: ${error.message}`);
    process.exit(1);
  }
  console.log(JSON.stringify(data, null, 2));
}

// ─── Main ──────────────────────────────────────────────────────────────────────

(async () => {
  if (customQuery) {
    await runCustomQuery(customQuery);
  } else {
    await runPresetAudit();
  }
})().catch(err => {
  console.error('✗ Unexpected error:', err?.message ?? err);
  process.exit(1);
});

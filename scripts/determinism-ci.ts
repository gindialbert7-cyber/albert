#!/usr/bin/env node
/**
 * scripts/determinism-ci.ts
 *
 * Renders the canonical document suite, hashes each output, and compares
 * against the golden hashes committed in `scripts/determinism-golden.json`.
 * Exits non-zero on any divergence.
 *
 * Usage:
 *   tsx scripts/determinism-ci.ts           # verify
 *   tsx scripts/determinism-ci.ts --update  # rewrite golden file
 *
 * Designed to run in CI on Linux x86 + Linux ARM + macOS ARM; any
 * mismatch across platforms blocks merge.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

import { buildSuite } from './determinism-suite';

type GoldenEntry = { name: string; sha256: string };

function sha256(s: string): string {
  return crypto.createHash('sha256').update(s, 'utf-8').digest('hex');
}

async function main() {
  const suite = await buildSuite();
  const actual: GoldenEntry[] = suite.map((doc) => ({
    name: doc.name,
    sha256: sha256(doc.render()),
  }));

  const here = path.dirname(fileURLToPath(import.meta.url));
  const goldenPath = path.join(here, 'determinism-golden.json');

  const update = process.argv.slice(2).includes('--update');

  if (update) {
    fs.writeFileSync(goldenPath, JSON.stringify(actual, null, 2) + '\n');
    console.log(`✓ Wrote ${actual.length} golden hashes to ${path.relative(process.cwd(), goldenPath)}`);
    return;
  }

  if (!fs.existsSync(goldenPath)) {
    console.error(`✗ Golden file not found at ${goldenPath}.`);
    console.error('  Run with --update to create it.');
    process.exit(2);
  }

  const golden = JSON.parse(fs.readFileSync(goldenPath, 'utf-8')) as GoldenEntry[];
  const goldenMap = new Map(golden.map((g) => [g.name, g.sha256]));

  let failed = 0;
  for (const a of actual) {
    const expected = goldenMap.get(a.name);
    if (!expected) {
      console.error(`✗ NEW   ${a.name} (not in golden)`);
      failed++;
      continue;
    }
    if (expected !== a.sha256) {
      console.error(`✗ DRIFT ${a.name}`);
      console.error(`    expected: ${expected}`);
      console.error(`    actual:   ${a.sha256}`);
      failed++;
    }
  }
  const actualNames = new Set(actual.map((a) => a.name));
  for (const g of golden) {
    if (!actualNames.has(g.name)) {
      console.error(`✗ REMOVED ${g.name} (in golden but not in suite)`);
      failed++;
    }
  }

  if (failed === 0) {
    console.log(`✓ All ${actual.length} canonical documents byte-identical to golden.`);
    return;
  }
  console.error(`\n${failed} divergence${failed === 1 ? '' : 's'}. The renderer is no longer byte-stable.`);
  console.error('If this is intentional, bump renderer-output-version and run with --update.');
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

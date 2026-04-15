#!/usr/bin/env node
/**
 * scripts/validate-book.ts
 *
 * Validates a .book.json file against the Albert BookDocument schema.
 * Exits with code 0 on success, 1 on failure.
 *
 * Usage:
 *   npx ts-node scripts/validate-book.ts path/to/my-book.book.json
 *   npx ts-node scripts/validate-book.ts books/*.book.json   # batch
 */

import fs   from 'fs';
import path from 'path';
import { validateBookDocument, BookDocument } from '../constants/BookSchema';

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: validate-book.ts <file.book.json> [file2.book.json ...]');
  process.exit(1);
}

let allValid = true;

for (const filePath of args) {
  const abs = path.resolve(filePath);
  console.log(`\n── Validating: ${path.basename(abs)} ──`);

  let raw: string;
  try {
    raw = fs.readFileSync(abs, 'utf-8');
  } catch {
    console.error(`  ✗ Cannot read file: ${abs}`);
    allValid = false;
    continue;
  }

  let doc: unknown;
  try {
    doc = JSON.parse(raw);
  } catch (e: any) {
    console.error(`  ✗ Invalid JSON: ${e.message}`);
    allValid = false;
    continue;
  }

  const result = validateBookDocument(doc);

  if (result.errors.length > 0) {
    allValid = false;
    console.error(`  ✗ ${result.errors.length} error(s):`);
    result.errors.forEach(e => console.error(`      • ${e}`));
  }

  if (result.warnings.length > 0) {
    result.warnings.forEach(w => console.warn(`  ⚠  ${w}`));
  }

  if (result.valid) {
    const b = doc as BookDocument;
    const totalSections = b.chapters.reduce((sum, ch) => sum + ch.sections.length, 0);
    console.log(`  ✓ Valid  — ${b.chapters.length} chapter(s), ${totalSections} section(s)`);
    console.log(`    id:       ${b.id}`);
    console.log(`    title:    ${b.title}`);
    console.log(`    category: ${b.category}`);
    console.log(`    layout:   ${b.layoutMode}`);
  }
}

if (!allValid) {
  console.error('\n✗ Validation failed. Fix the errors above before uploading.\n');
  process.exit(1);
} else {
  console.log('\n✓ All files valid.\n');
  process.exit(0);
}

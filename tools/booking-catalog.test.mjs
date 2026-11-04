import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const csv = readFileSync('packages/database/prisma/data/brands_models_dropdown_clean.csv', 'utf8').replace(/^\uFEFF/, '');
const sql = readFileSync('packages/database/prisma/migrations/20261104120000_import_booking_brand_models/migration.sql', 'utf8');

function parseCsvLine(line) {
  const cells = [];
  let cell = '', quoted = false;
  for (let index = 0; index < line.length; index++) {
    const char = line[index];
    if (char === '"') {
      if (quoted && line[index + 1] === '"') { cell += '"'; index++; }
      else quoted = !quoted;
    } else if (char === ',' && !quoted) { cells.push(cell); cell = ''; }
    else cell += char;
  }
  return [...cells, cell];
}

test('booking catalog imports every distinct normalized CSV pair with stable IDs', () => {
  const rows = csv.trim().split(/\r?\n/).slice(1).map(parseCsvLine);
  const pairs = new Set(rows.map(([brand, model]) => JSON.stringify([brand.trim().replace(/\s+/g, ' '), model.trim().replace(/\s+/g, ' ')])));
  const imported = [...sql.matchAll(/\('car_catalog_([a-f0-9]{20})', '((?:[^']|'')*)', '((?:[^']|'')*)'\)/g)];
  assert.equal(rows.length, 128);
  assert.equal(pairs.size, 127);
  assert.equal(imported.length, pairs.size);
  assert.equal(new Set(imported.map(row => row[1])).size, pairs.size);
  for (const [, , model, brand] of imported) assert.ok(pairs.has(JSON.stringify([brand.replaceAll("''", "'"), model.replaceAll("''", "'")])));
});

test('booking catalog migration preserves existing models, activity and appointment links', () => {
  assert.match(sql, /WHERE NOT EXISTS/);
  assert.match(sql, /lower\(regexp_replace\(trim\(existing.brand\)/);
  assert.match(sql, /lower\(regexp_replace\(trim\(existing.name_en\)/);
  assert.match(sql, /ON CONFLICT \("id"\) DO NOTHING/);
  assert.doesNotMatch(sql, /\b(DELETE FROM|UPDATE\s+"|TRUNCATE|DROP TABLE)\b/i);
  assert.doesNotMatch(sql, /INSERT INTO "service_appointments"/);
});

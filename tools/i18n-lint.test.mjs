import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { checkI18nArabicText } from './i18n-lint.mjs';

test('i18n lint accepts current web Arabic files', () => {
  assert.deepEqual(checkI18nArabicText(), []);
});

test('i18n lint rejects mojibake and Arabic blocks without Arabic code points', () => {
  const root = mkdtempSync(join(tmpdir(), 'cms-auto-i18n-lint-'));
  mkdirSync(join(root, 'apps/web/src/i18n'), { recursive: true });
  const mojibake = String.fromCharCode(0x00d8, 0x00a7);
  writeFileSync(join(root, 'apps/web/src/i18n/bad.ts'), `export const text = { ar: { title: '${mojibake}' } };\n`);
  writeFileSync(join(root, 'apps/web/src/i18n/missing.ts'), "export const text = {\n  ar: { title: 'Arabic only' }\n};\n");

  assert.deepEqual(checkI18nArabicText(root), [
    'apps/web/src/i18n/bad.ts: contains Arabic mojibake marker',
    'apps/web/src/i18n/bad.ts: Arabic locale must contain Arabic code points',
    'apps/web/src/i18n/missing.ts: Arabic locale must contain Arabic code points',
  ]);
});

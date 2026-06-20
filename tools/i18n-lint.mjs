import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const mojibakeMarkers = /[\u00c2\u00c3\u00d8\u00d9\ufffd]/;
const arabicText = /[\u0600-\u06ff]/;

export function checkI18nArabicText(root = process.cwd()) {
  const dir = join(root, 'apps/web/src/i18n');
  if (!existsSync(dir)) return [];

  return readdirSync(dir)
    .filter((file) => file.endsWith('.ts'))
    .flatMap((file) => checkI18nFile(root, file));
}

function checkI18nFile(root, file) {
  const relative = `apps/web/src/i18n/${file}`;
  const text = readFileSync(join(root, relative), 'utf8');
  const errors = [];

  if (mojibakeMarkers.test(text)) {
    errors.push(`${relative}: contains Arabic mojibake marker`);
  }

  const arMatch = text.match(/\bar\s*:/);
  if (arMatch && !arabicText.test(text.slice(arMatch.index))) {
    errors.push(`${relative}: Arabic locale must contain Arabic code points`);
  }

  return errors;
}

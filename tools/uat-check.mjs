import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const requiredUiIds = [
  'UI-001', 'UI-001A', 'UI-002', 'UI-003', 'UI-004', 'UI-005', 'UI-006',
  'UI-007', 'UI-008', 'UI-009', 'UI-010', 'UI-011', 'UI-012', 'UI-013',
  'UI-014', 'UI-014A', 'UI-015', 'UI-016', 'UI-017', 'UI-018', 'UI-019',
  'UI-020',
];

export const requiredUatIds = Array.from({ length: 16 }, (_, index) => `UAT-${String(index + 1).padStart(3, '0')}`);

const requiredSignals = [
  'CMP-SEED-001',
  'CMP-SEED-002',
  'CMP-SEED-003',
  'SEEDDEMO00001',
  'SEEDDEMO00002',
  'Toyota Camry',
  'Hyundai Sonata',
  'Arabic RTL',
  'English LTR',
  'verification before tracking details',
  'Human sign-off is separate',
];

const forbiddenPatterns = [
  /\bTODO\b/i,
  /\bTBD\b/i,
  /lorem ipsum/i,
  /password\s*[:=]/i,
  /otp\s*[:=]\s*\d/i,
  /token\s*[:=]/i,
  /dms\s+code/i,
];

export function checkUatChecklistText(text) {
  const errors = [];

  for (const id of requiredUiIds) {
    if (!text.includes(id)) errors.push(`missing UI screen coverage: ${id}`);
  }

  for (const id of requiredUatIds) {
    if (!text.includes(id)) errors.push(`missing UAT scenario coverage: ${id}`);
  }

  for (const signal of requiredSignals) {
    if (!text.includes(signal)) errors.push(`missing required UAT signal: ${signal}`);
  }

  for (const pattern of forbiddenPatterns) {
    if (pattern.test(text)) errors.push(`forbidden placeholder or secret-like text: ${pattern.source}`);
  }

  return errors;
}

export function checkUatChecklist(path = 'docs/operations/uat-phase7.md') {
  return checkUatChecklistText(readFileSync(path, 'utf8'));
}

function main() {
  const errors = checkUatChecklist();

  if (errors.length > 0) {
    process.stderr.write(`UAT checklist check failed\n${errors.join('\n')}\n`);
    process.exitCode = 1;
    return;
  }

  process.stdout.write('UAT checklist check passed\n');
}

const entryPath = process.argv[1] ? fileURLToPath(import.meta.url) : '';

if (entryPath === process.argv[1]) {
  main();
}

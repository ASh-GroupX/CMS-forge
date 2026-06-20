import assert from 'node:assert/strict';
import test from 'node:test';
import { checkUatChecklist, checkUatChecklistText, requiredUiIds, requiredUatIds } from './uat-check.mjs';

test('phase 7 UAT checklist covers every MVP screen and required scenario', () => {
  assert.deepEqual(checkUatChecklist(), []);
});

test('phase 7 UAT coverage constants include the full MVP inventory', () => {
  assert.equal(requiredUiIds.length, 22);
  assert.equal(requiredUatIds.length, 16);
  assert.ok(requiredUiIds.includes('UI-020'));
  assert.ok(requiredUatIds.includes('UAT-016'));
});

test('phase 7 UAT checker rejects missing coverage and secret-like placeholders', () => {
  const errors = checkUatChecklistText('UI-001\nUAT-001\npassword: demo\n');

  assert.ok(errors.includes('missing UI screen coverage: UI-020'));
  assert.ok(errors.includes('missing UAT scenario coverage: UAT-016'));
  assert.ok(errors.some((error) => error.includes('password')));
});

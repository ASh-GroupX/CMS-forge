import assert from 'node:assert/strict';
import test from 'node:test';
import { fieldErrorsFrom } from '../../src/lib/staff-error-envelope';

function jsonResponse(body: unknown, status = 400): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

test('reads field names from the real API error envelope (error.fieldErrors)', async () => {
  const response = jsonResponse({
    error: {
      code: 'TASK_STATUS_NOTE_REQUIRED',
      message: 'Done and waiting task updates require an outcome note',
      correlationId: 'req_1',
      fieldErrors: [{ field: 'statusNote', code: 'REQUIRED', message: 'statusNote is required.' }],
    },
  });
  assert.deepEqual(await fieldErrorsFrom(response), ['statusNote']);
});

test('returns multiple field names in order', async () => {
  const response = jsonResponse({ error: { fieldErrors: [{ field: 'reason' }, { field: 'ownerId' }] } });
  assert.deepEqual(await fieldErrorsFrom(response), ['reason', 'ownerId']);
});

test('does NOT read the legacy top-level details shape (which the API never emits)', async () => {
  const response = jsonResponse({ details: [{ field: 'statusNote' }] });
  assert.deepEqual(await fieldErrorsFrom(response), []);
});

test('tolerates a missing envelope, non-array fieldErrors, non-string fields, and non-JSON', async () => {
  assert.deepEqual(await fieldErrorsFrom(jsonResponse({})), []);
  assert.deepEqual(await fieldErrorsFrom(jsonResponse({ error: {} })), []);
  assert.deepEqual(await fieldErrorsFrom(jsonResponse({ error: { fieldErrors: 'nope' } })), []);
  assert.deepEqual(await fieldErrorsFrom(jsonResponse({ error: { fieldErrors: [{ code: 'X' }, { field: 7 }] } })), []);
  assert.deepEqual(await fieldErrorsFrom(new Response('not json', { status: 400 })), []);
});

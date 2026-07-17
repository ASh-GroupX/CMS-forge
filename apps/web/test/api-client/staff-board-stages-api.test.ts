import assert from 'node:assert/strict';
import test from 'node:test';
import { archiveBoardStage, createBoardStage, listAdminBoardStages, reorderBoardStages, updateBoardStage } from '../../src/lib/staff-board-stages-api';

const stage = {
  id: 'stage_open',
  code: 'TASKS_OPEN',
  scope: 'TASKS',
  nameEn: 'Open',
  nameAr: 'مفتوحة',
  color: 'slate',
  position: 0,
  isDefault: true,
  mappedTaskStatus: 'OPEN',
  mappedComplaintStatus: null,
};

const session = { cookieHeader: 'cms_staff_session=session; cms_csrf_token=csrf-token' };

test('stage list calls the scoped endpoint and validates the payload', async () => {
  const calls: string[] = [];
  const result = await listAdminBoardStages('TASKS', {
    apiUrl: 'http://api.test',
    ...session,
    fetchImpl: async (input) => { calls.push(String(input)); return jsonResponse({ items: [stage] }); },
  });
  assert.deepEqual(calls, ['http://api.test/board-stages?scope=TASKS']);
  assert.deepEqual(result, { status: 'ready', data: [stage] });

  assert.deepEqual(await listAdminBoardStages('TASKS', { cookieHeader: '' }), { status: 'denied' });
  assert.deepEqual(await listAdminBoardStages('TASKS', { ...session, fetchImpl: async () => jsonResponse({ items: [{ id: 'x' }] }) }), { status: 'error' });
});

test('stage writes send CSRF and map create/update/reorder/archive endpoints and payloads', async () => {
  const calls: Array<{ url: string; method: string; csrf: string; body: unknown }> = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({ url: String(input), method: init?.method ?? '', csrf: new Headers(init?.headers).get('x-csrf-token') ?? '', body: JSON.parse(String(init?.body)) });
    return jsonResponse({ stage }, 200);
  };

  assert.deepEqual(await createBoardStage({ code: 'TASKS_QA', scope: 'TASKS', nameEn: 'QA', nameAr: 'فحص', color: 'violet' }, { apiUrl: 'http://api.test', ...session, fetchImpl }), { status: 'success' });
  assert.deepEqual(await updateBoardStage('stage id', { color: 'red' }, { apiUrl: 'http://api.test', ...session, fetchImpl }), { status: 'success' });
  assert.deepEqual(await reorderBoardStages('TASKS', ['a', 'b'], { apiUrl: 'http://api.test', ...session, fetchImpl }), { status: 'success' });
  assert.deepEqual(await archiveBoardStage('stage_open', 'stage_done', { apiUrl: 'http://api.test', ...session, fetchImpl }), { status: 'success' });

  assert.deepEqual(calls.map((call) => [call.url, call.method]), [
    ['http://api.test/board-stages', 'POST'],
    ['http://api.test/board-stages/stage%20id', 'PATCH'],
    ['http://api.test/board-stages/reorder', 'POST'],
    ['http://api.test/board-stages/stage_open/archive', 'POST'],
  ]);
  assert.ok(calls.every((call) => call.csrf === 'csrf-token'));
  assert.deepEqual(calls[2]!.body, { scope: 'TASKS', orderedIds: ['a', 'b'] });
  assert.deepEqual(calls[3]!.body, { destinationStageId: 'stage_done' });
});

test('stage writes distinguish denied, conflict, not-found, validation, and error outcomes', async () => {
  const write = (fetchImpl: typeof fetch) => updateBoardStage('stage_open', { color: 'red' }, { ...session, fetchImpl });

  assert.deepEqual(await updateBoardStage('stage_open', { color: 'red' }, { cookieHeader: '' }), { status: 'denied' });
  assert.deepEqual(await write(async () => jsonResponse({}, 403)), { status: 'denied' });
  assert.deepEqual(await write(async () => jsonResponse({}, 404)), { status: 'not_found' });
  assert.deepEqual(await write(async () => jsonResponse({}, 409)), { status: 'conflict' });
  assert.deepEqual(await write(async () => jsonResponse({ error: { code: 'VALIDATION_FAILED', message: 'invalid', correlationId: 'req_1', fieldErrors: [{ field: 'color' }] } }, 400)), { status: 'invalid', fields: ['color'] });
  assert.deepEqual(await write(async () => jsonResponse({}, 500)), { status: 'error' });
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

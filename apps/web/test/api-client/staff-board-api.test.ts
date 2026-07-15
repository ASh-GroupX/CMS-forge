import assert from 'node:assert/strict';
import test from 'node:test';
import { assignTaskDepartment, getTaskBoardLoadResult, moveTaskCard } from '../../src/lib/staff-board-api';

const stage = {
  id: 'stage_open',
  code: 'TASKS_OPEN',
  nameEn: 'Open',
  nameAr: 'مفتوحة',
  color: 'slate',
  position: 0,
  mappedTaskStatus: 'OPEN',
};

const department = { id: 'dept_service', nameEn: 'Service', nameAr: 'الصيانة' };

const card = {
  id: 'task_1',
  title: 'Call the customer back',
  ownerId: 'usr_owner',
  ownerName: 'Owner',
  ownerNameAr: 'المالك',
  assigneeId: 'usr_assignee',
  assigneeName: 'Assignee',
  assigneeNameAr: 'المكلف',
  assignedDepartmentId: null,
  departmentName: null,
  departmentNameAr: null,
  branchId: 'branch_1',
  dueAt: '2026-07-15T10:00:00.000Z',
  status: 'OPEN',
  stageId: 'stage_open',
  boardPosition: 0,
  isCustomerPromise: true,
  visibility: 'NORMAL',
  confidentialityLevel: 'NORMAL',
  daysActive: 2,
  dueState: 'UPCOMING',
  commentCount: 3,
  createdAt: '2026-07-12T08:00:00.000Z',
  updatedAt: '2026-07-13T09:00:00.000Z',
};

test('task board load calls the scoped endpoint with the session cookie only', async () => {
  const calls: Array<{ url: string; cookie: string; method: string }> = [];
  const result = await getTaskBoardLoadResult({
    apiUrl: 'http://api.test',
    cookieHeader: 'cms_staff_session=session',
    fetchImpl: async (input, init) => {
      calls.push({ url: String(input), cookie: new Headers(init?.headers).get('cookie') ?? '', method: init?.method ?? 'GET' });
      return jsonResponse({ stages: [stage], columns: [{ stageId: 'stage_open', cards: [card] }], departments: [department] });
    },
  });

  assert.deepEqual(calls, [{ url: 'http://api.test/tasks/board', cookie: 'cms_staff_session=session', method: 'GET' }]);
  assert.deepEqual(result, { status: 'ready', data: { stages: [stage], columns: [{ stageId: 'stage_open', cards: [card] }], departments: [department] } });
});

test('task board load distinguishes denied, error, and malformed payloads', async () => {
  assert.deepEqual(await getTaskBoardLoadResult({ cookieHeader: '' }), { status: 'denied' });
  assert.deepEqual(await getTaskBoardLoadResult({
    cookieHeader: 'cms_staff_session=x', fetchImpl: async () => jsonResponse({}, 403),
  }), { status: 'denied' });
  assert.deepEqual(await getTaskBoardLoadResult({
    cookieHeader: 'cms_staff_session=x', fetchImpl: async () => jsonResponse({}, 500),
  }), { status: 'error' });
  assert.deepEqual(await getTaskBoardLoadResult({
    cookieHeader: 'cms_staff_session=x',
    fetchImpl: async () => jsonResponse({ stages: [stage], columns: [{ stageId: 'stage_open', cards: [{ id: 'task_1' }] }], departments: [] }),
  }), { status: 'error' });
  assert.deepEqual(await getTaskBoardLoadResult({
    cookieHeader: 'cms_staff_session=x',
    fetchImpl: async () => jsonResponse({ stages: [{ ...stage, position: 'first' }], columns: [], departments: [] }),
  }), { status: 'error' });
  // A board payload without the departments reference list is malformed.
  assert.deepEqual(await getTaskBoardLoadResult({
    cookieHeader: 'cms_staff_session=x',
    fetchImpl: async () => jsonResponse({ stages: [stage], columns: [] }),
  }), { status: 'error' });
});

test('move posts stage and position with the CSRF token and returns the updated card', async () => {
  const calls: Array<{ url: string; method: string; csrf: string; body: unknown }> = [];
  const result = await moveTaskCard('task 1', { stageId: 'stage_done', boardPosition: 2, statusNote: 'Resolved with customer' }, {
    apiUrl: 'http://api.test',
    cookieHeader: 'cms_staff_session=session; cms_csrf_token=csrf-token',
    fetchImpl: async (input, init) => {
      calls.push({
        url: String(input),
        method: init?.method ?? '',
        csrf: new Headers(init?.headers).get('x-csrf-token') ?? '',
        body: JSON.parse(String(init?.body)),
      });
      return jsonResponse({ card: { ...card, stageId: 'stage_done', boardPosition: 2, status: 'DONE' } });
    },
  });

  assert.deepEqual(calls, [{
    url: 'http://api.test/tasks/task%201/move',
    method: 'POST',
    csrf: 'csrf-token',
    body: { stageId: 'stage_done', boardPosition: 2, statusNote: 'Resolved with customer' },
  }]);
  assert.deepEqual(result, { status: 'success', card: { ...card, stageId: 'stage_done', boardPosition: 2, status: 'DONE' } });
});

test('move distinguishes denied, stage-not-found, validation, and error outcomes', async () => {
  const move = (fetchImpl: typeof fetch) =>
    moveTaskCard('task_1', { stageId: 'stage_done', boardPosition: 0 }, { cookieHeader: 'cms_staff_session=x', fetchImpl });

  assert.deepEqual(await moveTaskCard('task_1', { stageId: 's', boardPosition: 0 }, { cookieHeader: '' }), { status: 'denied' });
  assert.deepEqual(await move(async () => jsonResponse({}, 403)), { status: 'denied' });
  assert.deepEqual(await move(async () => jsonResponse({}, 404)), { status: 'not_found' });
  assert.deepEqual(
    await move(async () => jsonResponse({ details: [{ field: 'statusNote', code: 'REQUIRED' }] }, 400)),
    { status: 'invalid', fields: ['statusNote'] },
  );
  assert.deepEqual(await move(async () => jsonResponse({}, 500)), { status: 'error' });
  assert.deepEqual(await move(async () => jsonResponse({ card: { id: 'task_1' } })), { status: 'error' });
});

test('department assignment PATCHes the task with the CSRF token and null clears', async () => {
  const calls: Array<{ url: string; method: string; csrf: string; body: unknown }> = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({
      url: String(input),
      method: init?.method ?? '',
      csrf: new Headers(init?.headers).get('x-csrf-token') ?? '',
      body: JSON.parse(String(init?.body)),
    });
    return jsonResponse({ task: { id: 'task 1' } });
  };
  const options = { apiUrl: 'http://api.test', cookieHeader: 'cms_staff_session=session; cms_csrf_token=csrf-token', fetchImpl };

  assert.deepEqual(await assignTaskDepartment('task 1', 'dept_service', options), { status: 'success' });
  assert.deepEqual(await assignTaskDepartment('task 1', null, options), { status: 'success' });
  assert.deepEqual(calls, [
    { url: 'http://api.test/tasks/task%201', method: 'PATCH', csrf: 'csrf-token', body: { assignedDepartmentId: 'dept_service' } },
    { url: 'http://api.test/tasks/task%201', method: 'PATCH', csrf: 'csrf-token', body: { assignedDepartmentId: null } },
  ]);
});

test('department assignment distinguishes denied, not-found, validation, and error outcomes', async () => {
  const assign = (fetchImpl: typeof fetch) =>
    assignTaskDepartment('task_1', 'dept_ghost', { cookieHeader: 'cms_staff_session=x', fetchImpl });

  assert.deepEqual(await assignTaskDepartment('task_1', 'dept_service', { cookieHeader: '' }), { status: 'denied' });
  assert.deepEqual(await assign(async () => jsonResponse({}, 403)), { status: 'denied' });
  assert.deepEqual(await assign(async () => jsonResponse({}, 404)), { status: 'not_found' });
  assert.deepEqual(
    await assign(async () => jsonResponse({ details: [{ field: 'assignedDepartmentId', code: 'REQUIRED' }] }, 400)),
    { status: 'invalid', fields: ['assignedDepartmentId'] },
  );
  assert.deepEqual(await assign(async () => jsonResponse({}, 500)), { status: 'error' });
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

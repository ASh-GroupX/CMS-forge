import assert from 'node:assert/strict';
import test from 'node:test';
import { getManagerTaskDetailLoadResult } from '../../src/lib/staff-manager-task-detail-api';

const task = {
  id: 'task_1',
  title: 'Resolve delivery blocker',
  ownerId: 'usr_owner',
  ownerName: 'Owner',
  assigneeId: 'usr_assignee',
  assigneeName: 'Assignee',
  branchId: 'branch_1',
  branchName: 'Main branch',
  displayTimeZone: 'Asia/Riyadh',
  dueAt: '2026-07-14T10:00:00.000Z',
  status: 'IN_PROGRESS',
  nextAction: { what: 'Call customer', whoId: 'usr_assignee', whoName: 'Assignee', when: '2026-07-14T09:00:00.000Z' },
  isCustomerPromise: true,
  links: [{ entityType: 'COMPLAINT', entityId: 'cmp_1' }],
  stuckReasons: ['NEXT_ACTION_OVERDUE'],
  createdAt: '2026-07-13T08:00:00.000Z',
  updatedAt: '2026-07-13T09:00:00.000Z',
  capabilities: { canOpenInteractive: false },
};

test('manager task detail uses the scoped endpoint and accepts safe server capabilities', async () => {
  const calls: Array<{ url: string; cookie: string }> = [];
  const result = await getManagerTaskDetailLoadResult('task/1', {
    apiUrl: 'http://api.test',
    cookieHeader: 'cms_staff_session=session',
    fetchImpl: async (input, init) => {
      calls.push({ url: String(input), cookie: new Headers(init?.headers).get('cookie') ?? '' });
      return jsonResponse({ task });
    },
  });

  assert.deepEqual(calls, [{ url: 'http://api.test/tasks/task%2F1/manager-detail', cookie: 'cms_staff_session=session' }]);
  assert.deepEqual(result, { status: 'ready', data: task });
});

test('manager task detail distinguishes denied, missing, and invalid responses', async () => {
  assert.deepEqual(await getManagerTaskDetailLoadResult('task_1', { cookieHeader: '' }), { status: 'denied' });
  assert.deepEqual(await getManagerTaskDetailLoadResult('task_1', {
    cookieHeader: 'cms_staff_session=x', fetchImpl: async () => jsonResponse({}, 403),
  }), { status: 'denied' });
  assert.deepEqual(await getManagerTaskDetailLoadResult('task_1', {
    cookieHeader: 'cms_staff_session=x', fetchImpl: async () => jsonResponse({}, 404),
  }), { status: 'not_found' });
  assert.deepEqual(await getManagerTaskDetailLoadResult('task_1', {
    cookieHeader: 'cms_staff_session=x', fetchImpl: async () => jsonResponse({ task: { id: 'task_1' } }),
  }), { status: 'error' });
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

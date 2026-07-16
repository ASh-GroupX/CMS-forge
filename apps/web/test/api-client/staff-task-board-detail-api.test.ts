import assert from 'node:assert/strict';
import test from 'node:test';
import { getTaskCardDetail } from '../../src/lib/staff-task-board-detail-api';

const comment = {
  id: 'cmt_1',
  taskId: 'task_1',
  authorId: 'usr_1',
  authorName: 'Omar',
  authorNameAr: 'عمر',
  body: 'Called the customer to confirm the appointment.',
  mentions: [],
  createdAt: '2026-07-13T09:00:00.000Z',
};

test('task card detail fetches the scoped comments endpoint with the session cookie', async () => {
  const calls: Array<{ url: string; cookie: string; method: string }> = [];
  const result = await getTaskCardDetail('task 1', {
    apiUrl: 'http://api.test',
    cookieHeader: 'cms_staff_session=session',
    fetchImpl: async (input, init) => {
      calls.push({ url: String(input), cookie: new Headers(init?.headers).get('cookie') ?? '', method: init?.method ?? 'GET' });
      return jsonResponse({ comments: [comment] });
    },
  });

  assert.deepEqual(calls, [{ url: 'http://api.test/tasks/task%201/comments', cookie: 'cms_staff_session=session', method: 'GET' }]);
  assert.deepEqual(result, { status: 'ready', comments: [comment] });
});

test('task card detail denies without a session and never calls the API', async () => {
  let called = false;
  const result = await getTaskCardDetail('task_1', {
    cookieHeader: '',
    fetchImpl: async () => { called = true; return jsonResponse({ comments: [] }); },
  });
  assert.equal(called, false);
  assert.deepEqual(result, { status: 'denied' });
});

test('task card detail surfaces an error when the scoped read fails', async () => {
  assert.deepEqual(
    await getTaskCardDetail('task_1', { cookieHeader: 'cms_staff_session=x', fetchImpl: async () => jsonResponse({}, 403) }),
    { status: 'error' },
  );
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

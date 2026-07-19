import assert from 'node:assert/strict';
import test from 'node:test';
import { getComplaintCardDetail } from '../../src/lib/staff-complaint-board-detail-api';

const timelineItem = {
  id: 'evt_1',
  type: 'COMMENT',
  createdAt: '2026-07-13T09:00:00.000Z',
  actor: { id: 'usr_1', name: 'Layla', role: 'CR_MANAGER' },
  visibility: 'INTERNAL',
  customerVisible: false,
  summary: 'Left an internal note',
  body: 'Called the customer to confirm details.',
};

test('card detail fetches the scoped timeline endpoint with the session cookie', async () => {
  const calls: Array<{ url: string; cookie: string; method: string }> = [];
  const result = await getComplaintCardDetail('cmp 1', {
    apiUrl: 'http://api.test',
    cookieHeader: 'cms_staff_session=session',
    fetchImpl: async (input, init) => {
      calls.push({ url: String(input), cookie: new Headers(init?.headers).get('cookie') ?? '', method: init?.method ?? 'GET' });
      return jsonResponse({ items: [timelineItem] });
    },
  });

  assert.deepEqual(calls, [{ url: 'http://api.test/complaints/cmp%201/timeline', cookie: 'cms_staff_session=session', method: 'GET' }]);
  assert.deepEqual(result, { status: 'ready', timeline: [timelineItem] });
});

test('card detail denies without a session and never calls the API', async () => {
  let called = false;
  const result = await getComplaintCardDetail('cmp_1', {
    cookieHeader: '',
    fetchImpl: async () => { called = true; return jsonResponse({ items: [] }); },
  });
  assert.equal(called, false);
  assert.deepEqual(result, { status: 'denied' });
});

test('card detail surfaces an error on a transport/non-ok response (never throws)', async () => {
  assert.deepEqual(
    await getComplaintCardDetail('cmp_1', { cookieHeader: 'cms_staff_session=x', fetchImpl: async () => jsonResponse({}, 500) }),
    { status: 'error' },
  );
  assert.deepEqual(
    await getComplaintCardDetail('cmp_1', { cookieHeader: 'cms_staff_session=x', fetchImpl: async () => { throw new Error('network'); } }),
    { status: 'error' },
  );
});

test('card detail stays ready with an empty timeline on a valid-but-empty response', async () => {
  assert.deepEqual(
    await getComplaintCardDetail('cmp_1', { cookieHeader: 'cms_staff_session=x', fetchImpl: async () => jsonResponse({ items: [] }) }),
    { status: 'ready', timeline: [] },
  );
  // A valid 200 whose rows all fail the timeline validator is still a successful read.
  assert.deepEqual(
    await getComplaintCardDetail('cmp_1', { cookieHeader: 'cms_staff_session=x', fetchImpl: async () => jsonResponse({ items: [{ id: 'x' }] }) }),
    { status: 'ready', timeline: [] },
  );
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

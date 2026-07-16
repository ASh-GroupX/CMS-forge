import assert from 'node:assert/strict';
import test from 'node:test';
import { getComplaintBoardLoadResult, transitionComplaint } from '../../src/lib/staff-complaint-board-api';

const stage = {
  id: 'tstage_submitted',
  code: 'TICKETS_SUBMITTED',
  nameEn: 'Submitted',
  nameAr: 'مُرسلة',
  color: 'blue',
  position: 0,
  mappedComplaintStatus: 'SUBMITTED',
};

const card = {
  id: 'cmp_1',
  referenceNumber: 'CMP-2026-0001',
  status: 'SUBMITTED',
  severity: 'HIGH',
  subject: 'Late delivery',
  branchId: 'branch_1',
  branchName: 'Riyadh',
  displayTimeZone: 'Asia/Riyadh',
  ownerId: null,
  ownerName: null,
  slaState: 'WARNING',
  slaDueAt: '2026-07-16T09:00:00.000Z',
  slaStage: 'RESOLUTION',
  slaPercentElapsed: 60,
  nextAction: 'Manager intake review',
  createdAt: '2026-07-12T08:00:00.000Z',
  updatedAt: '2026-07-13T09:00:00.000Z',
  stageId: 'tstage_submitted',
  allowedTransitions: [{ action: 'ACCEPT_INTAKE', toStatus: 'MANAGER_REVIEW' }],
};

test('ticket board load calls the scoped endpoint with the session cookie only', async () => {
  const calls: Array<{ url: string; cookie: string; method: string }> = [];
  const result = await getComplaintBoardLoadResult({
    apiUrl: 'http://api.test',
    cookieHeader: 'cms_staff_session=session',
    fetchImpl: async (input, init) => {
      calls.push({ url: String(input), cookie: new Headers(init?.headers).get('cookie') ?? '', method: init?.method ?? 'GET' });
      return jsonResponse({ stages: [stage], columns: [{ stageId: 'tstage_submitted', cards: [card] }] });
    },
  });

  assert.deepEqual(calls, [{ url: 'http://api.test/complaints/board', cookie: 'cms_staff_session=session', method: 'GET' }]);
  assert.deepEqual(result, { status: 'ready', data: { stages: [stage], columns: [{ stageId: 'tstage_submitted', cards: [card] }] } });
});

test('ticket board load distinguishes denied, error, and malformed payloads', async () => {
  assert.deepEqual(await getComplaintBoardLoadResult({ cookieHeader: '' }), { status: 'denied' });
  assert.deepEqual(await getComplaintBoardLoadResult({ cookieHeader: 'cms_staff_session=x', fetchImpl: async () => jsonResponse({}, 403) }), { status: 'denied' });
  assert.deepEqual(await getComplaintBoardLoadResult({ cookieHeader: 'cms_staff_session=x', fetchImpl: async () => jsonResponse({}, 500) }), { status: 'error' });
  // Missing required card fields → malformed.
  assert.deepEqual(await getComplaintBoardLoadResult({
    cookieHeader: 'cms_staff_session=x',
    fetchImpl: async () => jsonResponse({ stages: [stage], columns: [{ stageId: 'tstage_submitted', cards: [{ id: 'cmp_1' }] }] }),
  }), { status: 'error' });
  // A transition without a valid toStatus → malformed.
  assert.deepEqual(await getComplaintBoardLoadResult({
    cookieHeader: 'cms_staff_session=x',
    fetchImpl: async () => jsonResponse({ stages: [stage], columns: [{ stageId: 'tstage_submitted', cards: [{ ...card, allowedTransitions: [{ action: 'ACCEPT_INTAKE', toStatus: 'NOPE' }] }] }] }),
  }), { status: 'error' });
});

test('transition posts the fromStatus/action payload with the CSRF token', async () => {
  const calls: Array<{ url: string; method: string; csrf: string; body: unknown }> = [];
  const result = await transitionComplaint('cmp 1', { fromStatus: 'BRANCH_REVIEW', action: 'ASSIGN_INVESTIGATION', ownerId: 'usr_owner', reason: 'Assigning' }, {
    apiUrl: 'http://api.test',
    cookieHeader: 'cms_staff_session=session; cms_csrf_token=csrf-token',
    fetchImpl: async (input, init) => {
      calls.push({ url: String(input), method: init?.method ?? '', csrf: new Headers(init?.headers).get('x-csrf-token') ?? '', body: JSON.parse(String(init?.body)) });
      return jsonResponse({ transition: { complaintId: 'cmp 1', toStatus: 'IN_PROGRESS' } });
    },
  });

  assert.deepEqual(calls, [{
    url: 'http://api.test/complaints/cmp%201/transitions',
    method: 'POST',
    csrf: 'csrf-token',
    body: { fromStatus: 'BRANCH_REVIEW', action: 'ASSIGN_INVESTIGATION', ownerId: 'usr_owner', reason: 'Assigning' },
  }]);
  assert.deepEqual(result, { status: 'success' });
});

test('transition distinguishes conflict, denied, not-found, validation, and error outcomes', async () => {
  const run = (fetchImpl: typeof fetch) =>
    transitionComplaint('cmp_1', { fromStatus: 'SUBMITTED', action: 'ACCEPT_INTAKE' }, { cookieHeader: 'cms_staff_session=x', fetchImpl });

  assert.deepEqual(await transitionComplaint('cmp_1', { fromStatus: 'SUBMITTED', action: 'ACCEPT_INTAKE' }, { cookieHeader: '' }), { status: 'denied' });
  assert.deepEqual(await run(async () => jsonResponse({}, 403)), { status: 'denied' });
  assert.deepEqual(await run(async () => jsonResponse({}, 404)), { status: 'not_found' });
  // A stale status is a 409 → conflict, the board's conflict state.
  assert.deepEqual(await run(async () => jsonResponse({ code: 'COMPLAINT_INVALID_TRANSITION' }, 409)), { status: 'conflict' });
  assert.deepEqual(
    await run(async () => jsonResponse({ details: [{ field: 'reason', code: 'REQUIRED' }] }, 400)),
    { status: 'invalid', fields: ['reason'] },
  );
  assert.deepEqual(await run(async () => jsonResponse({}, 500)), { status: 'error' });
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

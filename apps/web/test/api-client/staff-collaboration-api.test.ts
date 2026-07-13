import assert from 'node:assert/strict';
import test from 'node:test';
import { deactivateCommunicationGroup, getStaffCommunicationGroups, writeCommunicationGroup } from '../../src/lib/staff-communication-groups-api';
import { addTaskComment, getTaskCommunicationTargets, removeTaskWatcher } from '../../src/lib/staff-task-detail-api';

function jsonResponse(body: unknown, status = 200) {
  return new Response(status === 204 ? null : JSON.stringify(body), { headers: { 'content-type': 'application/json' }, status });
}

test('task target search preserves server capabilities watcher state and limits', async () => {
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  const body = {
    targets: [{ id: 'usr_2', type: 'USER', label: 'Ahmed', labelAr: 'أحمد', recipientCount: 1 }],
    currentWatchers: [{ userId: 'usr_3', name: 'Sara', nameAr: 'سارة' }],
    capabilities: { canComment: true, canManage: false, canManageWatchers: false },
    recipientLimit: 100,
    confirmationRequiredAbove: 25,
  };
  const fetchImpl: typeof fetch = async (input, init) => { calls.push({ input, init }); return jsonResponse(body); };

  const result = await getTaskCommunicationTargets('task/1', 'أح', fetchImpl);

  assert.deepEqual(result, body);
  assert.equal(calls[0]?.input, '/api/tasks/task%2F1/communication-targets?q=%D8%A3%D8%AD');
  assert.equal(calls[0]?.init?.credentials, 'include');
});

test('task comment client retains exact confirmation count and collaboration draft body', async () => {
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({ input, init });
    return jsonResponse({ error: { code: 'COLLABORATION_AUDIENCE_CONFIRMATION_REQUIRED', message: 'Confirm audience.', correlationId: 'corr_task', actualRecipientCount: 41 } }, 409);
  };
  const request = { body: 'Keep this draft', mentionTargets: [{ type: 'CUSTOM_GROUP' as const, id: 'group_1' }], ccUserIds: ['usr_2'] };

  const result = await addTaskComment('task_1', request, fetchImpl);

  assert.equal(calls[0]?.init?.body, JSON.stringify(request));
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error.actualRecipientCount, 41);
});

test('watcher and group deactivation clients accept empty 204 responses', async () => {
  const calls: string[] = [];
  const fetchImpl: typeof fetch = async (input) => { calls.push(String(input)); return jsonResponse(null, 204); };

  const watcher = await removeTaskWatcher('task/1', 'user/2', fetchImpl);
  const group = await deactivateCommunicationGroup('group/1', fetchImpl);

  assert.equal(watcher.ok, true);
  assert.equal(group.ok, true);
  assert.deepEqual(calls, ['/api/tasks/task%2F1/watchers/user%2F2', '/api/communication-groups/group%2F1']);
});

test('communication group read distinguishes ready denied and invalid responses', async () => {
  const data = { items: [], eligibleMembers: [], canManageShared: false };
  const ready = await getStaffCommunicationGroups({ cookieHeader: 'cms_staff_session=session', fetchImpl: async () => jsonResponse(data) });
  const denied = await getStaffCommunicationGroups({ cookieHeader: 'cms_staff_session=session', fetchImpl: async () => jsonResponse({}, 403) });
  const invalid = await getStaffCommunicationGroups({ cookieHeader: 'cms_staff_session=session', fetchImpl: async () => jsonResponse({ items: [] }) });

  assert.deepEqual(ready, { status: 'ready', data });
  assert.deepEqual(denied, { status: 'denied' });
  assert.deepEqual(invalid, { status: 'error' });
});

test('group writes send only name visibility and member IDs', async () => {
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  const group = { id: 'group_1', name: 'Team', visibility: 'PERSONAL', ownerId: 'usr_1', members: [], createdAt: '2026-07-13T00:00:00.000Z', updatedAt: '2026-07-13T00:00:00.000Z' };
  const fetchImpl: typeof fetch = async (input, init) => { calls.push({ input, init }); return jsonResponse(group); };
  const value = { name: 'Team', visibility: 'PERSONAL' as const, memberUserIds: ['usr_2'] };

  const result = await writeCommunicationGroup(null, value, fetchImpl);

  assert.equal(result.ok, true);
  assert.equal(calls[0]?.input, '/api/communication-groups');
  assert.equal(calls[0]?.init?.body, JSON.stringify(value));
  assert.doesNotMatch(String(calls[0]?.init?.body), /role|branch|owner|actor|email/i);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { queueCollaboration, flushCollaborationDigests } from './notifications.collaboration.js';

const person = (userId: string) => ({ userId, email: `${userId}@example.test`, nameEn: userId, nameAr: 'موظف' });

test('direct collaboration delivery wins over CC and keeps Arabic-first safe content', async () => {
  const queued: unknown[] = [];
  const digests: unknown[] = [];
  await queueCollaboration(
    { queueInternal: async (input: unknown) => { queued.push(input); return {} as never; } },
    { queue: async (input: unknown) => { digests.push(input); } } as never,
    { recordType: 'TASK', recordId: 'task_1', complaintId: 'complaint_1', href: '/tasks/task_1', title: 'اتصال العميل', excerpt: '  متابعة   مطلوبة ', confidential: false, eventKey: 'event_1', assignment: person('assignee'), mentions: [person('mentioned')], watchers: [person('mentioned'), person('watcher')] },
  );

  assert.equal(queued.length, 5);
  assert.equal(digests.length, 1);
  assert.match(JSON.stringify(queued), /لديك تحديث بشأن/);
  assert.match(JSON.stringify(queued), /task\.mention/);
  assert.doesNotMatch(JSON.stringify(digests), /mentioned/);
});

test('CC digest groups eligible events by recipient and record after the aggregation window', async () => {
  const queued: Array<Record<string, unknown>> = [];
  const delivered: string[][] = [];
  const items = [
    item('digest_1', 'watcher_1', 'TASK', 'task_1'),
    item('digest_2', 'watcher_1', 'TASK', 'task_1'),
    item('digest_3', 'watcher_2', 'COMPLAINT', 'complaint_1'),
  ];
  const result = await flushCollaborationDigests(
    { queueInternal: async (input: Record<string, unknown>) => { queued.push(input); return {} as never; } },
    { pendingBefore: async () => items, markDelivered: async (ids: string[]) => { delivered.push(ids); return ids.length; } } as never,
    100,
    new Date('2026-07-13T12:00:00.000Z'),
  );

  assert.deepEqual(result, { queued: 2, delivered: 3 });
  assert.equal(queued.length, 2);
  assert.match(JSON.stringify(queued[0]), /لديك 2 تحديثات جديدة/);
  assert.deepEqual(delivered, [['digest_1', 'digest_2'], ['digest_3']]);
});

function item(id: string, recipientUserId: string, recordType: 'TASK' | 'COMPLAINT', recordId: string) {
  return { id, recipientUserId, recordType, recordId, eventKey: id, payload: { href: `/${recordType.toLowerCase()}s/${recordId}`, title: 'سجل' }, createdAt: new Date('2026-07-13T11:00:00.000Z'), recipientUser: { email: `${recipientUserId}@example.test`, nameEn: recipientUserId, nameAr: 'موظف' } };
}

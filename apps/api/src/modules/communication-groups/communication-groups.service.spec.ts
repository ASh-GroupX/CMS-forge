import assert from 'node:assert/strict';
import test from 'node:test';
import { CommunicationGroupsRepository } from './communication-groups.repository.js';
import { CommunicationGroupsService, type CommunicationActor } from './communication-groups.service.js';
import { AuditService } from '../../core/audit.service.js';

test('communication-groups service can be constructed', () => {
  assert.ok(new CommunicationGroupsService(new CommunicationGroupsRepository({} as never), new AuditService({} as never)));
});

test('personal group owner can create a scoped group', async () => {
  const repository = {
    listStaffForBranch: async () => [staff('user_member')],
    transaction: async <T>(work: (client: never) => Promise<T>) => work({} as never),
    create: async () => group('PERSONAL', 'user_owner'),
  } as unknown as CommunicationGroupsRepository;
  const service = new CommunicationGroupsService(repository, { record: async () => undefined } as never);

  const created = await service.create(actor('user_owner'), { name: 'Follow up', visibility: 'PERSONAL', memberUserIds: ['user_member'] });

  assert.equal(created.visibility, 'PERSONAL');
  assert.deepEqual(created.members.map((member) => member.userId), ['user_member']);
});

test('another employee cannot update a personal communication group', async () => {
  const repository = { find: async () => group('PERSONAL', 'user_owner') } as unknown as CommunicationGroupsRepository;
  const service = new CommunicationGroupsService(repository, { record: async () => undefined } as never);

  await assert.rejects(
    service.update('group_1', actor('user_other'), { name: 'Follow up', visibility: 'PERSONAL', memberUserIds: [] }),
    (error: unknown) => (error as { code?: string }).code === 'RBAC_FORBIDDEN',
  );
});

test('admin with communication group permission can create a shared group', async () => {
  const repository = {
    listStaffForBranch: async () => [staff('user_member')],
    transaction: async <T>(work: (client: never) => Promise<T>) => work({} as never),
    create: async () => group('SHARED', 'user_admin'),
  } as unknown as CommunicationGroupsRepository;
  const service = new CommunicationGroupsService(repository, { record: async () => undefined } as never);

  const created = await service.create(actor('user_admin', ['COMMUNICATION_GROUPS_MANAGE']), { name: 'Service leaders', visibility: 'SHARED', memberUserIds: ['user_member'] });

  assert.equal(created.visibility, 'SHARED');
});

test('blank communication target search returns groups without the employee directory', async () => {
  const repository = {
    listStaffForBranch: async () => [staff('user_member')],
    listVisible: async () => [],
  } as unknown as CommunicationGroupsRepository;
  const service = new CommunicationGroupsService(repository, { record: async () => undefined } as never);

  const result = await service.targets(actor('user_owner'), 'branch_1');

  assert.ok(result.targets.length > 0);
  assert.ok(result.targets.every((target) => target.type !== 'USER'));
});

test('two-character target search includes employees and limits the response to 20', async () => {
  const repository = {
    listStaffForBranch: async () => Array.from({ length: 30 }, (_, index) => staff(`user_member_${index}`)),
    listVisible: async () => [],
  } as unknown as CommunicationGroupsRepository;
  const service = new CommunicationGroupsService(repository, { record: async () => undefined } as never);

  const result = await service.targets(actor('user_owner'), 'branch_1', 'Me');

  assert.equal(result.targets.length, 20);
  assert.ok(result.targets.some((target) => target.type === 'USER'));
});

test('audience confirmation error exposes the exact resolved recipient count', () => {
  const service = new CommunicationGroupsService({} as never, {} as never);

  assert.throws(
    () => service.assertAudience(31),
    (error: unknown) => (error as { code?: string; actualRecipientCount?: number }).code === 'COLLABORATION_AUDIENCE_CONFIRMATION_REQUIRED'
      && (error as { actualRecipientCount?: number }).actualRecipientCount === 31,
  );
});

function actor(userId: string, permissions: string[] = []): CommunicationActor {
  return { userId, roleCode: 'ADMIN', branchId: 'branch_1', permissions };
}

function staff(id: string) {
  return { id, email: `${id}@example.test`, nameEn: 'Member', nameAr: 'عضو', branchId: 'branch_1', departmentId: null, role: { id: 'role_1', code: 'CR_OFFICER', nameEn: 'Officer', nameAr: 'موظف' }, department: null };
}

function group(visibility: 'PERSONAL' | 'SHARED', ownerId: string) {
  return { id: 'group_1', name: 'Follow up', visibility, ownerId, isActive: true, createdAt: new Date('2026-07-13T00:00:00.000Z'), updatedAt: new Date('2026-07-13T00:00:00.000Z'), members: [{ user: staff('user_member') }] };
}

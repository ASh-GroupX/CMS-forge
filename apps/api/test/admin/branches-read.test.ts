import assert from 'node:assert/strict';
import test from 'node:test';
import { BranchesRepository } from '../../src/modules/branches/branches.repository.ts';
import type { BranchRecord } from '../../src/modules/branches/branches.repository.ts';
import { BranchesService } from '../../src/modules/branches/branches.service.ts';

const activeBranch: BranchRecord = {
  id: 'branch_main',
  code: 'MAIN',
  nameEn: 'Main Branch',
  nameAr: 'Main Branch',
  timezone: 'Asia/Riyadh',
  isActive: true,
  createdAt: new Date('2026-06-18T10:00:00.000Z'),
  updatedAt: new Date('2026-06-18T11:00:00.000Z'),
};

test('branch service lists active branches as explicit response objects', async () => {
  const service = new BranchesService({
    listActive: async () => [activeBranch],
    findByIdOrCode: async () => null,
  } as BranchesRepository);

  const result = await service.listActive();

  assert.deepEqual(result, [{
    id: 'branch_main',
    code: 'MAIN',
    nameEn: 'Main Branch',
    nameAr: 'Main Branch',
    timezone: 'Asia/Riyadh',
    isActive: true,
    createdAt: '2026-06-18T10:00:00.000Z',
    updatedAt: '2026-06-18T11:00:00.000Z',
  }]);
  assert.equal('complaints' in result[0]!, false);
});

test('branch service finds by id or code and returns null when missing', async () => {
  const service = new BranchesService({
    listActive: async () => [],
    findByIdOrCode: async (idOrCode) => (idOrCode === 'MAIN' ? activeBranch : null),
  } as BranchesRepository);

  assert.equal((await service.findByIdOrCode('MAIN'))?.id, 'branch_main');
  assert.equal(await service.findByIdOrCode('missing'), null);
});

test('branch repository queries active list and id/code lookup', async () => {
  const calls: unknown[] = [];
  const repository = new BranchesRepository({
    branch: {
      findMany: async (query: unknown) => {
        calls.push(query);
        return [];
      },
      findFirst: async (query: unknown) => {
        calls.push(query);
        return null;
      },
    },
  } as never);

  await repository.listActive();
  await repository.findByIdOrCode('MAIN');

  assert.deepEqual(calls[0], {
    where: { isActive: true },
    orderBy: [{ nameEn: 'asc' }, { code: 'asc' }],
    select: {
      id: true,
      code: true,
      nameEn: true,
      nameAr: true,
      timezone: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  assert.deepEqual(calls[1], {
    where: { OR: [{ id: 'MAIN' }, { code: 'MAIN' }] },
    select: {
      id: true,
      code: true,
      nameEn: true,
      nameAr: true,
      timezone: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });
});

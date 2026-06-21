import assert from 'node:assert/strict';
import test from 'node:test';
import { ComplaintSeverity, RoleCode } from '@prisma/client';
import { ComplaintFormOptionsService } from '../../src/modules/complaints/complaint-form-options.service.ts';

test('complaint form options come from DB and branch scope comes from the server principal', async () => {
  const branchQueries: unknown[] = [];
  const service = new ComplaintFormOptionsService({
    branch: { findMany: async (query: unknown) => { branchQueries.push(query); return [{ id: 'branch_main', code: 'MAIN', nameEn: 'Main Branch', nameAr: 'الفرع الرئيسي' }]; } },
    category: { findMany: async () => [{ id: 'cat_engine', code: 'ENGINE', nameEn: 'Engine', nameAr: 'المحرك', parentId: null }] },
  } as never);

  const options = await service.list({ sessionId: 'ses_1', userId: 'usr_1', email: 'u@test', nameEn: 'User', nameAr: 'User', roleCode: RoleCode.CR_OFFICER, branchId: 'branch_main' });

  assert.deepEqual((branchQueries[0] as { where: unknown }).where, { isActive: true, id: 'branch_main' });
  assert.deepEqual(options.branches.map((branch) => branch.nameEn), ['Main Branch']);
  assert.deepEqual(options.categories.map((category) => category.code), ['ENGINE']);
  assert.deepEqual(options.severities, Object.values(ComplaintSeverity));
});

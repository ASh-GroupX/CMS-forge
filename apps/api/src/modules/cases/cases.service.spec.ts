import assert from 'node:assert/strict';
import test from 'node:test';
import { CaseLinkEntityType, CaseType, ComplaintStatus, TaskLinkEntityType } from '@prisma/client';
import { AppException } from '../../core/http-kernel.js';
import { CasesRepository } from './cases.repository.js';
import type { CaseRecord, CreateCaseData } from './cases.repository.js';
import { CasesService } from './cases.service.js';

test('case draft accepts customer link without requiring a vehicle', async () => {
  let captured: CreateCaseData | undefined;
  const service = new CasesService({
    create: async (data: CreateCaseData) => {
      captured = data;
      return caseRecord({ ...data, id: 'case_1', links: withCreatedAt(data.links) });
    },
  } as unknown as CasesRepository);

  const result = await service.createDraft({
    branchId: 'branch_1',
    ownerId: 'owner_1',
    subject: 'Late delivery',
    descriptionEn: 'Customer delivery promise missed',
    links: [{ entityType: CaseLinkEntityType.CUSTOMER, entityId: 'customer_1' }],
  });

  assert.equal(captured?.type, CaseType.CUSTOMER_COMPLAINT);
  assert.equal(captured?.status, ComplaintStatus.DRAFT);
  assert.deepEqual(result.links, [{ entityType: CaseLinkEntityType.CUSTOMER, entityId: 'customer_1' }]);
});

test('case draft rejects empty or invalid links', async () => {
  const service = new CasesService({ create: async () => caseRecord() } as unknown as CasesRepository);

  await assert.rejects(
    service.createDraft({ branchId: 'branch_1', subject: 'Late delivery', descriptionEn: 'Missing link', links: [] }),
    (error) => error instanceof AppException && error.code === 'VALIDATION_FAILED',
  );
  await assert.rejects(
    service.createDraft({
      branchId: 'branch_1',
      subject: 'Late delivery',
      descriptionEn: 'Bad link',
      links: [{ entityType: 'BAD' as CaseLinkEntityType, entityId: 'customer_1' }],
    }),
    (error) => error instanceof AppException && error.code === 'VALIDATION_FAILED',
  );
});

test('case timeline returns metadata links and task link shape', async () => {
  const service = new CasesService({
    findById: async () => caseRecord({
      id: 'case_1',
      links: [{ entityType: CaseLinkEntityType.COMPLAINT, entityId: 'complaint_1', createdAt: new Date('2026-06-20T09:00:00.000Z') }],
    }),
  } as unknown as CasesRepository);

  const result = await service.timeline('case_1');

  assert.equal(result.case.id, 'case_1');
  assert.deepEqual(result.taskLink, { entityType: TaskLinkEntityType.CASE, entityId: 'case_1' });
  assert.deepEqual(result.events.map((event) => event.type), ['CASE_CREATED', 'CASE_LINKED']);
});

test('task link for case rejects blank ids', () => {
  const service = new CasesService({} as CasesRepository);

  assert.throws(
    () => service.taskLinkForCase(' '),
    (error) => error instanceof AppException && error.code === 'VALIDATION_FAILED',
  );
});

function caseRecord(overrides: Partial<CaseRecord> & { links?: CaseRecord['links'] } = {}): CaseRecord {
  const now = new Date('2026-06-20T08:00:00.000Z');
  return {
    id: 'case_1',
    type: CaseType.CUSTOMER_COMPLAINT,
    status: ComplaintStatus.DRAFT,
    branchId: 'branch_1',
    ownerId: 'owner_1',
    subject: 'Late delivery',
    descriptionEn: 'Customer delivery promise missed',
    descriptionAr: null,
    createdAt: now,
    updatedAt: now,
    links: [{ entityType: CaseLinkEntityType.CUSTOMER, entityId: 'customer_1', createdAt: now }],
    ...overrides,
  };
}

function withCreatedAt(links: CreateCaseData['links']): CaseRecord['links'] {
  return links.map((link) => ({ ...link, createdAt: new Date('2026-06-20T08:00:00.000Z') }));
}

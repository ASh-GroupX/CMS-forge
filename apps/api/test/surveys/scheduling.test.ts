import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { SurveyStatus } from '@prisma/client';
import { AppException } from '../../src/core/http-kernel.ts';
import { NotificationsService } from '../../src/modules/notifications/notifications.service.ts';
import { ComplaintsService } from '../../src/modules/complaints/complaints.service.ts';
import { ComplaintSurveysController, SurveysController } from '../../src/modules/surveys/surveys.controller.ts';
import { SurveysRepository } from '../../src/modules/surveys/surveys.repository.ts';
import { SurveysService } from '../../src/modules/surveys/surveys.service.ts';

test('survey scheduling creates a pending survey then queues notification', async () => {
  const calls: unknown[] = [];
  const service = new SurveysService({
    findPending: async (complaintId, customerId) => {
      calls.push({ find: { complaintId, customerId } });
      return null;
    },
    createPending: async (data) => {
      calls.push({ create: { ...data, tokenHashLength: data.tokenHash.length, tokenHash: undefined } });
      return surveyRecord(data);
    },
  } as SurveysRepository, {
    queueInternal: async (input) => {
      calls.push({ queue: input });
      return {} as never;
    },
  } as NotificationsService);

  const result = await service.scheduleClosureSurvey({
    complaintId: 'cmp_1',
    customerId: 'cust_1',
    locale: 'ar',
    now: new Date('2026-06-19T10:00:00.000Z'),
    expiresInHours: 48,
  });

  assert.equal(result.created, true);
  assert.equal(typeof result.surveyToken, 'string');
  assert.equal(result.expiresAt, '2026-06-21T10:00:00.000Z');
  assert.deepEqual(calls[0], { find: { complaintId: 'cmp_1', customerId: 'cust_1' } });
  assert.deepEqual(calls[1], { create: { complaintId: 'cmp_1', customerId: 'cust_1', tokenHash: undefined, tokenHashLength: 64, expiresAt: new Date('2026-06-21T10:00:00.000Z') } });
  assert.deepEqual((calls[2] as { queue: { templateCode: string; locale: string } }).queue.templateCode, 'survey.link.customer');
  assert.deepEqual((calls[2] as { queue: { locale: string } }).queue.locale, 'ar');
});

test('survey scheduling is idempotent for pending complaint customer pair', async () => {
  let createCalled = false;
  let queueCalled = false;
  const service = new SurveysService({
    findPending: async () => surveyRecord({ complaintId: 'cmp_1', customerId: 'cust_1' }),
    createPending: async () => {
      createCalled = true;
      throw new Error('create should not run');
    },
  } as SurveysRepository, {
    queueInternal: async () => {
      queueCalled = true;
      throw new Error('queue should not run');
    },
  } as unknown as NotificationsService);

  const result = await service.scheduleClosureSurvey({ complaintId: 'cmp_1', customerId: 'cust_1' });

  assert.equal(result.created, false);
  assert.equal(result.surveyToken, null);
  assert.equal(createCalled, false);
  assert.equal(queueCalled, false);
});

test('survey scheduling rejects invalid input before write or notification', async () => {
  let createCalled = false;
  let queueCalled = false;
  const service = new SurveysService({
    findPending: async () => {
      throw new Error('find should not run');
    },
    createPending: async () => {
      createCalled = true;
      throw new Error('create should not run');
    },
  } as unknown as SurveysRepository, {
    queueInternal: async () => {
      queueCalled = true;
      throw new Error('queue should not run');
    },
  } as unknown as NotificationsService);

  await assert.rejects(
    service.scheduleClosureSurvey({ complaintId: '', customerId: 'cust_1' }),
    (error: unknown) => error instanceof AppException && error.code === 'VALIDATION_FAILED',
  );
  assert.equal(createCalled, false);
  assert.equal(queueCalled, false);
});

test('survey scheduling does not expose stored token hash', async () => {
  const service = new SurveysService({
    findPending: async () => null,
    createPending: async (data) => surveyRecord(data),
  } as SurveysRepository, { queueInternal: async () => ({} as never) } as NotificationsService);

  const result = await service.scheduleClosureSurvey({ complaintId: 'cmp_1', customerId: 'cust_1' });
  const json = JSON.stringify(result);

  assert.equal('tokenHash' in result, false);
  assert.equal(/tokenHash|password|credential|secret/i.test(json), false);
});

test('portal survey submission accepts one valid unexpired token', async () => {
  const calls: unknown[] = [];
  const token = 'survey_token';
  const service = new SurveysService({
    findPendingByTokenHash: async (tokenHash) => {
      calls.push({ tokenHash });
      return surveyRecord({ tokenHash, expiresAt: new Date('2026-06-20T10:00:00.000Z') });
    },
    submitPending: async (id, data) => {
      calls.push({ submit: { id, data } });
      return { ...surveyRecord({ id }), rating: data.rating, submittedAt: data.submittedAt };
    },
  } as SurveysRepository, {} as NotificationsService);

  const result = await service.submitPortalSurvey({
    surveyToken: token,
    rating: 5,
    comment: 'Great',
    now: new Date('2026-06-19T10:00:00.000Z'),
  });

  assert.deepEqual(calls[0], { tokenHash: hash(token) });
  assert.deepEqual(result, { survey: { id: 'survey_1', rating: 5, submittedAt: '2026-06-19T10:00:00.000Z' } });
  assert.equal(JSON.stringify(result).includes('token'), false);
});

test('portal survey submission denies invalid expired and duplicate tokens safely', async () => {
  const expired = new SurveysService({
    findPendingByTokenHash: async () => surveyRecord({ expiresAt: new Date('2026-06-18T10:00:00.000Z') }),
  } as SurveysRepository, {} as NotificationsService);
  await assert.rejects(
    expired.submitPortalSurvey({ surveyToken: 'expired', rating: 4, now: new Date('2026-06-19T10:00:00.000Z') }),
    (error: unknown) => error instanceof AppException && error.code === 'PORTAL_VERIFICATION_FAILED',
  );

  const duplicate = new SurveysService({
    findPendingByTokenHash: async () => surveyRecord({}),
    submitPending: async () => null,
  } as SurveysRepository, {} as NotificationsService);
  await assert.rejects(
    duplicate.submitPortalSurvey({ surveyToken: 'used', rating: 4 }),
    (error: unknown) => error instanceof AppException && error.code === 'PORTAL_VERIFICATION_FAILED',
  );
});

test('portal survey route validates request body and delegates safely', async () => {
  const calls: unknown[] = [];
  const controller = new SurveysController({
    submitPortalSurvey: async (input) => {
      calls.push(input);
      return { survey: { id: 'survey_1', rating: input.rating ?? 0, submittedAt: '2026-06-19T10:00:00.000Z' } };
    },
  } as SurveysService);

  assert.deepEqual(await controller.submit({ surveyToken: ' token ', rating: 3, comment: ' ok ' }), {
    survey: { id: 'survey_1', rating: 3, submittedAt: '2026-06-19T10:00:00.000Z' },
  });
  assert.deepEqual(calls[0], { surveyToken: 'token', rating: 3, comment: 'ok' });
  await assert.rejects(
    controller.submit({ surveyToken: 'token', rating: 6 }),
    (error: unknown) => error instanceof AppException && error.code === 'VALIDATION_FAILED',
  );
});

test('portal survey OpenAPI documents submission route without private fields', () => {
  const openapi = JSON.parse(readFileSync('packages/contracts/openapi.json', 'utf8'));
  assert.ok(openapi.paths['/portal/surveys']?.post);
  const responseJson = JSON.stringify(openapi.components.schemas.PortalSurveySubmitResponse);
  assert.equal(/tokenHash|staff|internal|providerSecret|credentials/i.test(responseJson), false);
});

test('staff survey read verifies complaint visibility before survey read', async () => {
  const calls: unknown[] = [];
  const controller = new ComplaintSurveysController({
    listSubmittedForComplaint: async (complaintId) => {
      calls.push({ survey: complaintId });
      return [staffSurvey()];
    },
  } as SurveysService, {
    getDetail: async (complaintId, filter) => {
      calls.push({ complaint: { complaintId, filter } });
      return { branchId: 'branch_main' };
    },
  } as ComplaintsService);

  assert.deepEqual(await controller.list('cmp_1', 'branch_main', request()), { items: [staffSurvey()] });
  assert.deepEqual(calls, [
    { complaint: { complaintId: 'cmp_1', filter: { branchId: 'branch_main' } } },
    { survey: 'cmp_1' },
  ]);
});

test('staff survey read denies branch-hidden complaints before survey read', async () => {
  let surveyRead = false;
  const controller = new ComplaintSurveysController({
    listSubmittedForComplaint: async () => {
      surveyRead = true;
      throw new Error('survey read should not run');
    },
  } as unknown as SurveysService, {
    getDetail: async () => {
      throw new AppException('COMPLAINT_NOT_FOUND', 'Complaint not found', 404);
    },
  } as ComplaintsService);

  await assert.rejects(
    controller.list('cmp_1', 'branch_other', request()),
    (error: unknown) => error instanceof AppException && error.code === 'COMPLAINT_NOT_FOUND',
  );
  assert.equal(surveyRead, false);
});

test('staff survey service returns submitted results without private fields', async () => {
  const service = new SurveysService({
    listSubmittedByComplaint: async () => [surveyRecord({ rating: 4, comment: 'Good', submittedAt: new Date('2026-06-19T10:00:00.000Z') })],
  } as SurveysRepository, {} as NotificationsService);

  const result = await service.listSubmittedForComplaint('cmp_1');
  const json = JSON.stringify(result);

  assert.deepEqual(result, [{ id: 'survey_1', complaintId: 'cmp_1', rating: 4, comment: 'Good', submittedAt: '2026-06-19T10:00:00.000Z' }]);
  assert.equal(/token|tokenHash|provider|credential|audit|staff|customerId/i.test(json), false);
});

test('staff survey repository excludes pending surveys', async () => {
  const calls: unknown[] = [];
  const repository = new SurveysRepository({
    survey: {
      findMany: async (query: unknown) => {
        calls.push(query);
        return [];
      },
    },
  } as never);

  assert.deepEqual(await repository.listSubmittedByComplaint('cmp_1'), []);
  assert.deepEqual(calls[0], {
    where: { complaintId: 'cmp_1', status: SurveyStatus.SUBMITTED, submittedAt: { not: null } },
    orderBy: { submittedAt: 'desc' },
    select: surveySelect(),
  });
});

test('staff survey OpenAPI documents submitted result route without private fields', () => {
  const openapi = JSON.parse(readFileSync('packages/contracts/openapi.json', 'utf8'));
  assert.ok(openapi.paths['/complaints/{id}/surveys']?.get);
  assert.equal(/token|tokenHash|providerSecret|credentials|audit/i.test(JSON.stringify(openapi.components.schemas.StaffSurveyResult)), false);
});

function surveyRecord(overrides: Record<string, unknown>) {
  return {
    id: 'survey_1',
    complaintId: 'cmp_1',
    customerId: 'cust_1',
    status: SurveyStatus.PENDING,
    tokenHash: 'a'.repeat(64),
    expiresAt: new Date('2026-06-21T10:00:00.000Z'),
    createdAt: new Date('2026-06-19T10:00:00.000Z'),
    rating: null,
    comment: null,
    submittedAt: null,
    ...overrides,
  };
}

function hash(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function staffSurvey() {
  return { id: 'survey_1', complaintId: 'cmp_1', rating: 5, comment: 'Great', submittedAt: '2026-06-19T10:00:00.000Z' };
}

function request() {
  return {
    principal: { sessionId: 'ses_1', userId: 'usr_1', email: 'u@test', nameEn: 'User', nameAr: 'User', roleCode: 'CR_MANAGER', branchId: 'branch_main' },
    headers: {},
  };
}

function surveySelect() {
  return {
    id: true,
    complaintId: true,
    customerId: true,
    status: true,
    tokenHash: true,
    expiresAt: true,
    createdAt: true,
    rating: true,
    comment: true,
    submittedAt: true,
  };
}

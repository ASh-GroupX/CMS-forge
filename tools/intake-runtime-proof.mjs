import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
const require = createRequire(new URL('../apps/api/package.json', import.meta.url));
require('reflect-metadata');
const { PrismaClient } = require('@prisma/client'); const argon = require('argon2');
const database = process.env.INTAKE_PROOF_DATABASE_URL;
if (!database || new URL(database).hostname !== '127.0.0.1' || !new URL(database).pathname.endsWith('/cms_intake_proof')) throw Error('Use isolated loopback cms_intake_proof');
const prisma = new PrismaClient({ datasourceUrl: database }); const api = 'http://127.0.0.1:3100';
const password = 'Intake-proof-only-2026!';
async function login(user) {
  const response = await fetch(`${api}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identifier: user, password }) });
  assert.equal(response.status, 201); const cookies = response.headers.getSetCookie().map((value) => value.split(';')[0]);
  return { cookie: cookies.join('; '), csrf: cookies.find((value) => value.startsWith('cms_csrf_token='))?.split('=')[1] };
}
async function call(path, actor, method = 'GET', body, expected = 200) {
  const response = await fetch(`${api}${path}`, { method, headers: { 'Content-Type': 'application/json', ...(actor ? { cookie: actor.cookie, 'x-csrf-token': actor.csrf } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const data = await response.json(); assert.equal(response.status, expected, `${method} ${path}: ${JSON.stringify(data)}`); return data;
}
try {
  await prisma.branch.upsert({ where: { id: 'intake_branch' }, update: {}, create: { id: 'intake_branch', code: 'INTAKE_PROOF', nameEn: 'Intake proof branch', nameAr: 'فرع اختبار الاستقبال', timezone: 'Asia/Amman' } });
  await prisma.department.upsert({ where: { id: 'intake_department' }, update: {}, create: { id: 'intake_department', code: 'INTAKE_PROOF', nameEn: 'Intake proof department', nameAr: 'قسم اختبار الاستقبال', branchId: 'intake_branch' } });
  await prisma.category.upsert({ where: { id: 'intake_category' }, update: {}, create: { id: 'intake_category', code: 'INTAKE_PROOF', nameEn: 'Intake proof category', nameAr: 'تصنيف اختبار الاستقبال', branchId: 'intake_branch', departmentId: 'intake_department' } });
  const hash = await argon.hash(password);
  for (const [id, roleCode] of [['intake_admin', 'ADMIN'], ['intake_one', 'CR_MANAGER'], ['intake_two', 'CR_MANAGER'], ['intake_denied', 'CR_MANAGER']]) {
    const role = await prisma.role.findUniqueOrThrow({ where: { code: roleCode } });
    await prisma.user.upsert({ where: { id }, update: { passwordHash: hash, lockedAt: null }, create: { id, username: id, nameEn: id.replaceAll('_', ' '), nameAr: id === 'intake_one' ? 'موظف الاستقبال الأول' : 'موظف الاختبار', roleId: role.id, branchId: 'intake_branch', departmentId: 'intake_department', passwordHash: hash } });
  }
  const [admin, one, two, denied] = await Promise.all(['intake_admin', 'intake_one', 'intake_two', 'intake_denied'].map(login));
  const current = await call('/admin/portal-intake-settings', admin);
  await call('/admin/portal-intake-settings', one, 'GET', undefined, 403);
  const settings = { branchId: 'intake_branch', categoryId: 'intake_category', phoneCountryCode: '+962', memberIds: ['intake_one', 'intake_two'], expectedVersion: current?.version ?? null };
  await call('/admin/portal-intake-settings', admin, 'PUT', settings);
  await call('/admin/portal-intake-settings', admin, 'PUT', settings, 409);
  const freshSettings = await call('/admin/portal-intake-settings', admin);
  const configurationRace = await Promise.all([1, 2].map(() => fetch(`${api}/admin/portal-intake-settings`, { method: 'PUT', headers: { 'Content-Type': 'application/json', cookie: admin.cookie, 'x-csrf-token': admin.csrf }, body: JSON.stringify({ ...settings, expectedVersion: freshSettings.version }) })));
  assert.deepEqual(configurationRace.map((response) => response.status).sort(), [200, 409]);
  await call('/complaints/redirect-queue', denied, 'GET', undefined, 403);
  const publicOptions = await call('/portal/options'); assert.equal(publicOptions.phoneCountryCode, '+962'); assert.deepEqual(publicOptions.categories, []);
  const suffix = String(Date.now()).slice(-6);
  async function submit(number) { return (await call('/portal/complaints', null, 'POST', { customerName: 'Proof customer', customerPhone: `+96279${suffix}${number}`, vehicleBrand: 'Nissan', vehicleModel: 'Patrol', description: 'Synthetic intake workflow proof', incidentAt: '2026-11-12', odometer: 12000 }, 201)).complaint; }
  const first = await submit(1); const second = await submit(2);
  const key = await call('/integrations/data-api-keys', admin, 'POST', { name: 'Isolated intake proof', scopes: ['customers:read', 'portal-complaints:read'], allBranches: false, branchIds: ['intake_branch'] }, 201);
  const feed = await fetch(`${api}/external-data/portal-complaints?limit=100`, { headers: { Authorization: `Bearer ${key.secret}` } });
  assert.equal(feed.status, 200); const exported = await feed.json(); assert.ok(exported.items.some((item) => item.id === first.id && item.customerName === 'Proof customer'));
  assert.doesNotMatch(JSON.stringify(exported), /dmsCode|passwordHash|staff|statusHistory/);
  await call(`/integrations/data-api-keys/${key.key.id}/revoke`, admin, 'POST', {});
  assert.equal(await prisma.notification.count({ where: { complaintId: first.id, payload: { path: ['idempotencyKey'], string_starts_with: `portal-intake:${first.id}:` } } }), 2);
  assert.equal(await prisma.notification.count({ where: { complaintId: first.id, channel: 'SMS' } }), 0);
  const detail = await call(`/complaints/${first.id}/intake`, one);
  await call(`/complaints/${first.id}/transitions`, one, 'POST', { fromStatus: 'SUBMITTED', action: 'ACCEPT_INTAKE' }, 409);
  const attempts = await Promise.all([one, two].map(async (actor) => { const response = await fetch(`${api}/complaints/${first.id}/intake-claim`, { method: 'POST', headers: { 'Content-Type': 'application/json', cookie: actor.cookie, 'x-csrf-token': actor.csrf }, body: JSON.stringify({ expectedVersion: detail.expectedVersion }) }); return { status: response.status, actor, data: await response.json() }; }));
  assert.deepEqual(attempts.map((item) => item.status).sort(), [201, 409]);
  const winner = attempts.find((item) => item.status === 201); const loser = attempts.find((item) => item.status === 409);
  const changes = { customerName: 'Corrected proof customer', customerPhone: `+96278${suffix}1`, vehicleMake: 'Nissan', vehicleModel: 'Patrol', vehicleVin: null, odometer: 13000, incidentAt: '2026-11-12', description: 'Corrected synthetic proof', branchId: 'intake_branch', categoryId: 'intake_category', severity: 'HIGH', departmentId: 'intake_department', ownerId: null, reason: 'Verified synthetic details' };
  await call(`/complaints/${first.id}/intake`, winner.actor, 'PATCH', { ...changes, expectedVersion: detail.expectedVersion }, 409);
  await call(`/complaints/${first.id}/intake`, loser.actor, 'PATCH', { ...changes, expectedVersion: winner.data.expectedVersion }, 409);
  await call(`/complaints/${first.id}/intake-claim`, loser.actor, 'DELETE', { expectedVersion: winner.data.expectedVersion }, 403);
  const corrected = await call(`/complaints/${first.id}/intake`, winner.actor, 'PATCH', { ...changes, expectedVersion: winner.data.expectedVersion });
  const redirected = await call(`/complaints/${first.id}/intake-redirect`, winner.actor, 'POST', { ...changes, expectedVersion: corrected.expectedVersion }, 201);
  assert.equal(redirected.status, 'BRANCH_REVIEW');
  const history = await prisma.complaintStatusHistory.findMany({ where: { complaintId: first.id }, orderBy: { createdAt: 'asc' } });
  assert.deepEqual(history.slice(-2).map((event) => event.toStatus), ['MANAGER_REVIEW', 'BRANCH_REVIEW']);
  const claimedSecond = await call(`/complaints/${second.id}/intake`, one);
  const owned = await call(`/complaints/${second.id}/intake-claim`, one, 'POST', { expectedVersion: claimedSecond.expectedVersion }, 201);
  const direct = await call(`/complaints/${second.id}/intake-redirect`, one, 'POST', { ...changes, ownerId: 'intake_two', expectedVersion: owned.expectedVersion }, 201);
  assert.equal(direct.status, 'IN_PROGRESS');
  assert.equal((await prisma.assignment.findUniqueOrThrow({ where: { entityType_entityId: { entityType: 'COMPLAINT', entityId: second.id } } })).assignedUserId, 'intake_two');
  const audits = await prisma.auditLog.findMany({ where: { targetId: first.id }, select: { metadata: true } });
  assert.doesNotMatch(JSON.stringify(audits), /Corrected synthetic proof|Corrected proof customer|96278/);
  const browserComplaint = await submit(3);
  const pending = await call(`/complaints/${browserComplaint.id}/intake`, one);
  const pendingClaim = await call(`/complaints/${browserComplaint.id}/intake-claim`, one, 'POST', { expectedVersion: pending.expectedVersion }, 201);
  const { ComplaintIntakeService } = await import('../apps/api/dist/modules/complaints/complaint-intake.service.js');
  const { ComplaintIntakeRepository } = await import('../apps/api/dist/modules/complaints/complaint-intake.repository.js');
  const { AssignmentsService } = await import('../apps/api/dist/modules/assignments/assignments.service.js');
  const { AssignmentsRepository } = await import('../apps/api/dist/modules/assignments/assignments.repository.js');
  const { CustomersService } = await import('../apps/api/dist/modules/customers/customers.service.js');
  const { CustomersRepository } = await import('../apps/api/dist/modules/customers/customers.repository.js');
  const { AuditService } = await import('../apps/api/dist/core/audit.service.js');
  const audit = new AuditService(prisma);
  const failedAudit = { record: async (event, tx) => { if (event.action === 'APPROVE_AND_ROUTE') throw Error('Forced proof audit failure'); return audit.record(event, tx); } };
  let scheduled = false;
  const service = new ComplaintIntakeService(new ComplaintIntakeRepository(prisma), failedAudit, new AssignmentsService(new AssignmentsRepository(prisma), audit), new CustomersService(new CustomersRepository(prisma)), { list: async () => ({ branches: [{ id: 'intake_branch' }], categories: [{ id: 'intake_category', branchId: 'intake_branch' }], departments: [{ id: 'intake_department', branchId: 'intake_branch' }], users: [] }) }, { recordDeadlineEvent: async () => { scheduled = true; } }, { isMember: async () => true });
  const beforeRollback = await prisma.complaint.findUniqueOrThrow({ where: { id: browserComplaint.id } });
  const rollbackPhone = `+96277${suffix}9`;
  await assert.rejects(service.correct(browserComplaint.id, pendingClaim.expectedVersion, { ...changes, customerPhone: rollbackPhone, incidentAt: new Date(changes.incidentAt) }, { userId: 'intake_one', roleCode: 'CR_MANAGER', branchId: 'intake_branch' }, true), /Forced proof audit failure/);
  const afterRollback = await prisma.complaint.findUniqueOrThrow({ where: { id: browserComplaint.id } });
  assert.equal(afterRollback.updatedAt.toISOString(), beforeRollback.updatedAt.toISOString());
  assert.equal(afterRollback.customerId, beforeRollback.customerId);
  assert.equal(await prisma.customer.count({ where: { phone: rollbackPhone } }), 0);
  assert.equal(await prisma.complaintStatusHistory.count({ where: { complaintId: browserComplaint.id } }), 1);
  assert.equal(scheduled, false);
  await call(`/complaints/${browserComplaint.id}/intake-claim`, one, 'DELETE', { expectedVersion: pendingClaim.expectedVersion });
  writeFileSync('coverage/intake-browser-fixture.json', JSON.stringify({ browserComplaintId: browserComplaint.id, firstId: first.id, secondId: second.id }));
  console.log('Passed isolated PostgreSQL + HTTP: settings RBAC/conflict, private options, submission, two team notifications, no SMS, denied nonmember, simultaneous claims (201/409), stale and unclaimed edits, release denial/release, correction, department/owner redirect, ordered histories, assignment, PII-free audit and real rollback of complaint/customer/history on forced audit failure.');
} finally { await prisma.$disconnect(); }

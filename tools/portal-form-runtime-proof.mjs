import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(new URL('../apps/api/package.json', import.meta.url));
const { PrismaClient } = require('@prisma/client');
const database = process.env.INTAKE_PROOF_DATABASE_URL;
if (!database || new URL(database).hostname !== '127.0.0.1' || !new URL(database).pathname.endsWith('/cms_intake_proof')) throw Error('Use isolated loopback proof database');
const prisma = new PrismaClient({ datasourceUrl: database });
const api = 'http://127.0.0.1:3100';
async function login(name) {
  const response = await fetch(`${api}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identifier: name, password: 'Intake-proof-only-2026!' }) });
  assert.equal(response.status, 201); const cookies = response.headers.getSetCookie().map((line) => line.split(';')[0]);
  return { cookie: cookies.join('; '), csrf: cookies.find((line) => line.startsWith('cms_csrf_token='))?.split('=')[1] };
}
async function call(path, actor, method = 'GET', body, expected = 200) {
  const response = await fetch(`${api}${path}`, { method, headers: { 'Content-Type': 'application/json', ...(actor ? { cookie: actor.cookie, 'x-csrf-token': actor.csrf } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const data = await response.json(); assert.equal(response.status, expected, `${method} ${path}: ${JSON.stringify(data)}`); return data;
}
try {
  const admin = await login('intake_admin'); const staff = await login('intake_one');
  await call('/admin/portal-intake-settings/fields', staff, 'GET', undefined, 403);
  const current = await call('/admin/portal-intake-settings/fields', admin);
  const custom = { key: 'custom_visit', labelEn: 'Preferred visit', labelAr: 'موعد الزيارة', type: 'select', required: true, enabled: true, options: [{ value: 'morning', labelEn: 'Morning', labelAr: 'صباحاً' }, { value: 'evening', labelEn: 'Evening', labelAr: 'مساءً' }] };
  const optionalNote = { key: 'custom_note', labelEn: 'Additional note', labelAr: 'ملاحظة إضافية', type: 'text', required: false, enabled: true };
  const fields = [...current.fields.filter((field) => ![custom.key, optionalNote.key].includes(field.key)).map((field) => ({ ...field, required: false })), custom, optionalNote];
  const saved = await call('/admin/portal-intake-settings/fields', admin, 'PUT', { expectedVersion: current.version, fields });
  await call('/admin/portal-intake-settings/fields', admin, 'PUT', { expectedVersion: current.version, fields }, 409);
  const options = await call('/portal/options');
  assert.equal(options.fields.find((field) => field.key === 'vehicleVin').required, false);
  assert.ok(options.carModels.some((model) => model.brand === 'Nissan' && model.nameEn === 'Patrol'));
  assert.doesNotMatch(JSON.stringify(options), /memberIds|intake_one|branchId|categoryId/);
  const complaint = (await call('/portal/complaints', null, 'POST', { customerName: '', customerPhone: '', vehicleBrand: '', vehicleModel: '', description: '', incidentAt: '', vehicleVin: null, customFields: { custom_visit: 'morning', custom_note: 'Private initial note' } }, 201)).complaint;
  const row = await prisma.complaint.findUniqueOrThrow({ where: { id: complaint.id }, include: { customer: true } });
  assert.equal(row.portalData.values.custom_visit, 'morning');
  assert.equal(row.portalData.originalValues.custom_visit, 'morning');
  assert.equal(row.customerNameSnapshot, ''); assert.match(row.customer.phone, /^DMS-PORTAL-/);
  const key = await call('/integrations/data-api-keys', admin, 'POST', { name: 'Optional-fields proof', scopes: ['customers:read', 'portal-complaints:read'], allBranches: false, branchIds: ['intake_branch'] }, 201);
  const feedResponse = await fetch(`${api}/external-data/portal-complaints?limit=100`, { headers: { Authorization: `Bearer ${key.secret}` } });
  assert.equal(feedResponse.status, 200);
  const exported = (await feedResponse.json()).items.find((item) => item.id === complaint.id);
  assert.equal(exported.customerName, ''); assert.equal(exported.customerPhone, null);
  await call(`/integrations/data-api-keys/${key.key.id}/revoke`, admin, 'POST', {});
  await call('/admin/portal-intake-settings/fields', admin, 'PUT', { expectedVersion: saved.version, fields: fields.map((field) => field.key === custom.key ? { ...field, enabled: false } : field) });
  const detail = await call(`/complaints/${complaint.id}/intake`, staff);
  assert.equal(detail.portalData.values.custom_visit, 'morning'); assert.equal(detail.customerPhone, '');
  const claim = await call(`/complaints/${complaint.id}/intake-claim`, staff, 'POST', { expectedVersion: detail.expectedVersion }, 201);
  const corrected = await call(`/complaints/${complaint.id}/intake`, staff, 'PATCH', { expectedVersion: claim.expectedVersion, customerName: 'Corrected proof customer', customerPhone: '+962790000001', vehicleMake: 'Nissan', vehicleModel: 'Patrol', vehicleVin: null, odometer: null, incidentAt: '2026-11-12', description: 'Corrected complaint', branchId: 'intake_branch', categoryId: 'intake_category', severity: 'MEDIUM', departmentId: 'intake_department', ownerId: null, reason: 'Verified details', customFields: { custom_visit: 'evening', custom_note: '' } });
  assert.equal(corrected.portalData.values.custom_visit, 'evening'); assert.equal(corrected.portalData.originalValues.custom_visit, 'morning');
  assert.equal(corrected.portalData.values.custom_note, null); assert.equal(corrected.portalData.originalValues.custom_note, 'Private initial note');
  const routed = await call(`/complaints/${complaint.id}/intake-redirect`, staff, 'POST', { expectedVersion: corrected.expectedVersion, customerName: 'Corrected proof customer', customerPhone: '+962790000001', vehicleMake: 'Nissan', vehicleModel: 'Patrol', vehicleVin: null, odometer: null, incidentAt: '2026-11-12', description: 'Corrected complaint', branchId: 'intake_branch', categoryId: 'intake_category', severity: 'MEDIUM', departmentId: 'intake_department', ownerId: null, reason: 'Send to department', customFields: { custom_visit: 'evening', custom_note: '' } }, 201);
  assert.equal(routed.status, 'BRANCH_REVIEW');
  const normal = await call(`/complaints/${complaint.id}`, staff);
  assert.deepEqual(normal.complaint.portalAnswers.find((answer) => answer.key === 'custom_visit'), { key: 'custom_visit', labelEn: 'Preferred visit', labelAr: 'موعد الزيارة', value: 'evening' });
  assert.doesNotMatch(JSON.stringify(normal.complaint.portalAnswers), /Private initial note|morning|962790000001/);
  const audits = await prisma.auditLog.findMany({ where: { targetId: complaint.id }, select: { metadata: true } });
  assert.doesNotMatch(JSON.stringify(audits), /Corrected proof customer|Corrected complaint|962790000001|morning|evening|Private initial note/);
  console.log('Passed real Admin field settings RBAC/versioning, optional built-ins, required custom choice, active booking catalog, public submission snapshot, privacy-safe external customer export, custom answer clearing and post-redirect department detail.');
} finally { await prisma.$disconnect(); }

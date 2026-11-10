const assert = require('node:assert/strict');
const { createHash, randomBytes } = require('node:crypto');
const { PrismaClient } = require('@prisma/client');
const { IntegrationsRepository } = require('./dist/modules/integrations/integrations.repository.js');
const { IntegrationsService } = require('./dist/modules/integrations/integrations.service.js');
const { AuditService } = require('./dist/core/audit.service.js');

const prisma = new PrismaClient();
const base = 'http://127.0.0.1:35432';

async function main() {
  const database = new URL(process.env.DATABASE_URL ?? '');
  assert.equal(database.hostname, '127.0.0.1', 'proof requires an isolated local database');
  assert.equal(database.pathname, '/cms_auto_proof', 'proof requires the dedicated proof database');
  const user = await prisma.user.findFirst({ select: { id: true } });
  const branch = await prisma.branch.findFirst({ select: { id: true } });
  assert.ok(user && branch, 'seeded user and branch required');
  for (let index = 0; index < 2; index++) {
    await prisma.serviceAppointment.create({ data: {
      referenceNumber: `EXTERNAL-PROOF-${randomBytes(4).toString('hex')}-${index}`,
      branchId: branch.id,
      customerName: `Proof customer ${index}`,
      customerPhone: '+962790000000',
      carModelName: 'Proof model',
      maintenanceTypeName: 'Proof service',
      notes: 'Never export this note',
      date: new Date('2026-11-12T00:00:00.000Z'),
      startTime: '12:00', endTime: '12:15', durationMinutes: 15,
    } });
  }
  const secret = `cms_live_${randomBytes(32).toString('base64url')}`;
  const key = await prisma.integrationApiKey.create({ data: {
    name: 'Isolated live proof', keyPrefix: secret.slice(0, 18),
    tokenHash: createHash('sha256').update(secret).digest('hex'),
    scopes: ['customers:read', 'complaints:read', 'tasks:read', 'appointments:read'],
    branchIds: [branch.id], allBranches: false, createdById: user.id,
  } });
  const headers = { Authorization: `Bearer ${secret}` };
  const counts = {};
  let pageReads = 0;
  for (const resource of ['customers', 'complaints', 'tasks', 'appointments']) {
    const ids = new Set();
    let cursor;
    do {
      const url = new URL(`/external-data/${resource}`, base);
      url.searchParams.set('limit', '1');
      if (cursor) url.searchParams.set('cursor', cursor);
      const response = await fetch(url, { headers });
      assert.equal(response.status, 200, `${resource} page must succeed`);
      const page = await response.json();
      assert.ok(page.items.length <= 1);
      for (const item of page.items) {
        assert.ok(!ids.has(item.id), `${resource} cursor repeated an ID`);
        ids.add(item.id);
        assert.equal(item.notes, undefined);
        assert.equal(item.customerPhone, undefined);
        assert.equal(item.tokenHash, undefined);
        if (resource === 'appointments' || resource === 'complaints') assert.equal(item.branchId, branch.id);
      }
      cursor = page.nextCursor;
      pageReads++;
    } while (cursor);
    counts[resource] = ids.size;
  }
  assert.ok(counts.appointments >= 2);
  assert.ok(counts.customers > 0 && counts.complaints > 0 && counts.tasks > 0);
  const deniedBranch = await fetch(`${base}/external-data/customers?branchId=other`, { headers });
  assert.equal(deniedBranch.status, 403);
  const pageAudits = await prisma.auditLog.findMany({ where: { action: 'integration_data_page_read', targetId: key.id } });
  assert.equal(pageAudits.length, pageReads);
  await prisma.integrationApiKey.update({ where: { id: key.id }, data: { revokedAt: new Date() } });
  assert.equal((await fetch(`${base}/external-data/customers`, { headers })).status, 401);
  const repository = new IntegrationsRepository(prisma);
  const audit = new AuditService(prisma);
  const service = new IntegrationsService(repository, null, null, null, undefined, audit);
  const input = { name: 'Lifecycle proof', scopes: ['customers:read'], allBranches: true };
  const context = { actorId: user.id };
  const before = await prisma.integrationApiKey.count({ where: { name: input.name } });
  const failingAudit = { record: async () => { throw new Error('forced audit failure'); } };
  const failingService = new IntegrationsService(repository, null, null, null, undefined, failingAudit);
  await assert.rejects(failingService.createDataApiKey(input, context), /forced audit failure/);
  assert.equal(await prisma.integrationApiKey.count({ where: { name: input.name } }), before, 'failed audit must roll back the key');
  const created = await service.createDataApiKey(input, context);
  assert.ok(created.secret.startsWith('cms_live_'));
  const listed = await service.listDataApiKeys();
  assert.ok(listed.some((row) => row.id === created.key.id));
  assert.ok(!JSON.stringify(listed).includes(created.secret));
  assert.equal((await service.revokeDataApiKey(created.key.id, context)).revoked, true);
  const lifecycleAudits = await prisma.auditLog.count({ where: { targetId: created.key.id, action: { in: ['integration_data_api_key_created', 'integration_data_api_key_revoked'] } } });
  assert.equal(lifecycleAudits, 2);
  const admin = await prisma.user.findFirst({ where: { username: 'admin' }, select: { id: true } });
  assert.ok(admin);
  const sessionToken = randomBytes(32).toString('base64url');
  const csrf = randomBytes(32).toString('base64url');
  await prisma.staffSession.create({ data: {
    userId: admin.id,
    tokenHash: createHash('sha256').update(sessionToken).digest('base64url'),
    expiresAt: new Date(Date.now() + 60_000),
  } });
  const staffHeaders = { Cookie: `cms_staff_session=${sessionToken}; cms_csrf_token=${csrf}`, 'x-csrf-token': csrf, 'Content-Type': 'application/json' };
  const createdHttp = await fetch(`${base}/integrations/data-api-keys`, {
    method: 'POST', headers: staffHeaders,
    body: JSON.stringify({ name: 'HTTP lifecycle proof', scopes: ['customers:read'], branchIds: [branch.id] }),
  });
  assert.equal(createdHttp.status, 201, `HTTP create: ${createdHttp.status}`);
  const httpKey = await createdHttp.json();
  assert.ok(httpKey.secret.startsWith('cms_live_'));
  const listedHttp = await fetch(`${base}/integrations/data-api-keys`, { headers: staffHeaders });
  assert.equal(listedHttp.status, 200);
  const httpList = await listedHttp.json();
  assert.ok(httpList.items.some((row) => row.id === httpKey.key.id));
  assert.ok(!JSON.stringify(httpList).includes(httpKey.secret));
  assert.equal((await fetch(`${base}/external-data/customers`, { headers: { Authorization: `Bearer ${httpKey.secret}` } })).status, 200);
  assert.equal((await fetch(`${base}/external-data/complaints`, { headers: { Authorization: `Bearer ${httpKey.secret}` } })).status, 403);
  const revokedHttp = await fetch(`${base}/integrations/data-api-keys/${httpKey.key.id}/revoke`, { method: 'POST', headers: staffHeaders });
  assert.equal(revokedHttp.status, 200);
  assert.equal((await fetch(`${base}/external-data/customers`, { headers: { Authorization: `Bearer ${httpKey.secret}` } })).status, 401);
  console.log(JSON.stringify({ result: 'passed', counts, pageReads, pageAudits: pageAudits.length, branchDenied: true, resourceDenied: true, revokedDenied: true, lifecycleAudits, realRollback: true, httpLifecycle: true }));
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());

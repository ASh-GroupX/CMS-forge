import assert from 'node:assert/strict';
import test from 'node:test';
import { Reflector } from '@nestjs/core';
import { IntegrationApiKeyGuard, IntegrationApiScopes, type IntegrationApiRequest } from '../../src/modules/integrations/integration-api-key.guard.js';
import { hashApiKey } from '../../src/modules/integrations/integrations.service.js';

const secret = 'cms_live_1234567890123456789012345678901234567890123';
const activeKey = { id: 'key-1', name: 'External sync', createdById: 'admin-1', scopes: ['customers:read'], branchIds: ['branch-1'], allBranches: false };

function context(request: IntegrationApiRequest, scopes = ['customers:read']) {
  const handler = () => undefined;
  IntegrationApiScopes(...scopes as ('customers:read' | 'complaints:read' | 'tasks:read' | 'appointments:read')[])(handler);
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => handler,
    getClass: () => class TestController {},
  } as never;
}

function makeGuard(key: unknown = activeKey, marked = true) {
  const lookups: string[] = [];
  const audits: unknown[] = [];
  const repository = {
    findActiveApiKeyByHash: async (hash: string) => { lookups.push(hash); return key; },
    markApiKeyUsed: async () => marked,
  };
  const guard = new IntegrationApiKeyGuard(new Reflector(), repository as never, { record: async (entry: unknown) => { audits.push(entry); } } as never);
  return { guard, lookups, audits };
}

test('read-only key allows its granted resource and branch and stores only its hash in lookup', async () => {
  const request: IntegrationApiRequest = { method: 'GET', headers: { authorization: `Bearer ${secret}` }, query: { branchId: 'branch-1' } };
  const { guard, lookups } = makeGuard();
  assert.equal(await guard.canActivate(context(request)), true);
  assert.equal(lookups[0], hashApiKey(secret));
  assert.equal(request.integrationApiKey?.branchIds[0], 'branch-1');
});

test('read-only key denies an ungranted branch and records a security audit', async () => {
  const request: IntegrationApiRequest = { method: 'GET', headers: { authorization: `Bearer ${secret}` }, query: { branchId: 'branch-2' } };
  const { guard, audits } = makeGuard();
  await assert.rejects(guard.canActivate(context(request)));
  assert.equal(audits.length, 1);
  assert.equal((audits[0] as { branchId: string | null }).branchId, null);
  assert.deepEqual((audits[0] as { metadata: unknown }).metadata, {
    requiredScopes: ['customers:read'], requestedBranchId: 'branch-2',
  });
  assert.equal(JSON.stringify(audits).includes(secret), false);
});

test('read-only key rejects write requests and revoked/unknown credentials', async () => {
  const writeRequest: IntegrationApiRequest = { method: 'POST', headers: { authorization: `Bearer ${secret}` } };
  const { guard } = makeGuard();
  await assert.rejects(guard.canActivate(context(writeRequest)));
  const revoked = makeGuard(null);
  await assert.rejects(revoked.guard.canActivate(context({ method: 'GET', headers: { authorization: `Bearer ${secret}` } })));
});

test('scope metadata denies a key missing the route scope', async () => {
  const { guard, audits } = makeGuard();
  const request: IntegrationApiRequest = { method: 'GET', headers: { authorization: `Bearer ${secret}` } };
  await assert.rejects(guard.canActivate(context(request, ['complaints:read'])));
  assert.equal(audits.length, 1);
});

test('a key revoked between lookup and use is denied', async () => {
  const { guard } = makeGuard(activeKey, false);
  const request: IntegrationApiRequest = { method: 'GET', headers: { authorization: `Bearer ${secret}` } };
  await assert.rejects(guard.canActivate(context(request)), { status: 401 });
  assert.equal(request.integrationApiKey, undefined);
});

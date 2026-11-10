import assert from 'node:assert/strict';
import test from 'node:test';
import { Reflector } from '@nestjs/core';
import { IntegrationApiKeyGuard, IntegrationApiScopes } from '../../src/modules/integrations/integration-api-key.guard.js';
import { hashApiKey, IntegrationsService } from '../../src/modules/integrations/integrations.service.js';

test('creating a data API key persists only its hash and returns the secret once', async () => {
  let saved: Record<string, unknown> | undefined;
  let auditClient: object | undefined;
  const transactionClient = {};
  const repository = {
    transaction: async (work: (client: object) => Promise<unknown>) => work(transactionClient),
    createApiKey: async (data: Record<string, unknown>) => {
      saved = data;
      return { id: 'key-1', name: data.name, keyPrefix: data.keyPrefix, scopes: data.scopes,
        branchIds: data.branchIds, allBranches: data.allBranches, createdById: 'admin-1',
        createdAt: new Date(), lastUsedAt: null, revokedAt: null };
    },
  };
  const audit = { record: async (_entry: unknown, client: object) => { auditClient = client; } };
  const branches = { listActive: async () => [{ id: 'branch-1' }] };
  const service = new IntegrationsService(repository as never, {} as never, {} as never, {} as never, undefined, audit as never, branches as never);
  const result = await service.createDataApiKey({ name: 'Warehouse sync', scopes: ['customers:read'], branchIds: ['branch-1'] }, { actorId: 'admin-1' });
  assert.match(result.secret, /^cms_live_[A-Za-z0-9_-]{43}$/);
  assert.equal(saved?.tokenHash, hashApiKey(result.secret));
  assert.equal(JSON.stringify(result.key).includes(result.secret), false);
  assert.equal(JSON.stringify(result.key).includes(String(saved?.tokenHash)), false);
  assert.equal(auditClient, transactionClient);
});

test('data API key rejects empty branch scope and unsupported write scopes', async () => {
  const service = new IntegrationsService({} as never, {} as never, {} as never, {} as never);
  await assert.rejects(service.createDataApiKey({ name: 'x', scopes: ['customers:read'], branchIds: [] }, { actorId: 'admin-1' }));
  await assert.rejects(service.createDataApiKey({ name: 'x', scopes: ['customers:write'], allBranches: true }, { actorId: 'admin-1' }));
});

test('listing keys exposes metadata only even if a repository result has an unexpected hash field', async () => {
  const repository = { listApiKeys: async () => [{ id: 'key-list', name: 'Reader', keyPrefix: 'cms_live_abc', scopes: ['customers:read'], branchIds: ['branch-1'], allBranches: false, createdById: 'admin-1', createdAt: new Date(), lastUsedAt: null, revokedAt: null, tokenHash: 'must-not-leak' }] };
  const service = new IntegrationsService(repository as never, {} as never, {} as never, {} as never);
  const result = await service.listDataApiKeys();
  assert.equal(JSON.stringify(result).includes('must-not-leak'), false);
  assert.deepEqual(Object.keys(result[0] ?? {}).sort(), ['allBranches', 'branchIds', 'createdAt', 'createdById', 'id', 'keyPrefix', 'lastUsedAt', 'name', 'revokedAt', 'scopes'].sort());
});

test('revocation updates active key and writes scope metadata using the same transaction client', async () => {
  const client = {};
  let auditRecord: { entry: Record<string, unknown>; client: object } | undefined;
  let revoked = false;
  const key = { id: 'key-2', name: 'ERP', keyPrefix: 'cms_live_abcdef', scopes: ['tasks:read'], branchIds: ['branch-1'], allBranches: false };
  const repository = {
    transaction: async (work: (transaction: object) => Promise<boolean>) => work(client),
    findApiKeyById: async () => ({ ...key }),
    revokeApiKey: async (id: string, transaction: object) => { assert.equal(id, key.id); assert.equal(transaction, client); revoked = true; return true; },
  };
  const audit = { record: async (entry: Record<string, unknown>, transaction: object) => { auditRecord = { entry, client: transaction }; } };
  const service = new IntegrationsService(repository as never, {} as never, {} as never, {} as never, undefined, audit as never);
  assert.deepEqual(await service.revokeDataApiKey('key-2', { actorId: 'admin-1' }), { revoked: true });
  assert.equal(revoked, true);
  assert.equal(auditRecord?.client, client);
  assert.deepEqual(auditRecord?.entry.metadata, {
    name: 'ERP', keyPrefix: 'cms_live_abcdef', scopes: ['tasks:read'], branchIds: ['branch-1'], allBranches: false,
  });
});

test('creation fails closed when its audit write fails inside the transaction', async () => {
  const transactionClient = {};
  let committed = false;
  const repository = {
    transaction: async (work: (client: object) => Promise<unknown>) => {
      const result = await work(transactionClient);
      committed = true;
      return result;
    },
    createApiKey: async () => ({ id: 'key-3', name: 'Failure', keyPrefix: 'prefix', scopes: ['customers:read'], branchIds: ['branch-1'], allBranches: false, createdById: 'admin-1', createdAt: new Date(), lastUsedAt: null, revokedAt: null }),
  };
  const branches = { listActive: async () => [{ id: 'branch-1' }] };
  const service = new IntegrationsService(repository as never, {} as never, {} as never, {} as never, undefined,
    { record: async () => { throw new Error('audit unavailable'); } } as never, branches as never);
  await assert.rejects(service.createDataApiKey({ name: 'Failure', scopes: ['customers:read'], branchIds: ['branch-1'] }, { actorId: 'admin-1' }));
  assert.equal(committed, false);
});
test('created key stops authenticating after service revocation', async () => {
  const client = {};
  let row: Record<string, unknown> | null = null;
  const repository = {
    transaction: async (work: (tx: object) => Promise<unknown>) => work(client),
    createApiKey: async (data: Record<string, unknown>) => {
      row = { id: 'key-live', name: data.name, keyPrefix: data.keyPrefix, tokenHash: data.tokenHash,
        scopes: data.scopes, branchIds: data.branchIds, allBranches: data.allBranches, createdById: 'admin-1',
        createdAt: new Date(), lastUsedAt: null, revokedAt: null };
      const { tokenHash: _hash, ...safe } = row;
      return safe;
    },
    findApiKeyById: async () => row,
    revokeApiKey: async () => {
      if (!row || row.revokedAt) return false;
      row.revokedAt = new Date();
      return true;
    },
    findActiveApiKeyByHash: async (hash: string) => row?.tokenHash === hash && !row.revokedAt ? row : null,
    markApiKeyUsed: async () => true,
  };
  const audit = { record: async () => undefined };
  const branches = { listActive: async () => [{ id: 'branch-1' }] };
  const service = new IntegrationsService(repository as never, {} as never, {} as never, {} as never, undefined, audit as never, branches as never);
  const { secret } = await service.createDataApiKey({ name: 'Lifecycle', scopes: ['customers:read'], branchIds: ['branch-1'] }, { actorId: 'admin-1' });
  await service.revokeDataApiKey('key-live', { actorId: 'admin-1' });

  const handler = () => undefined;
  IntegrationApiScopes('customers:read')(handler);
  const request = { method: 'GET', headers: { authorization: `Bearer ${secret}` } };
  const context = { switchToHttp: () => ({ getRequest: () => request }), getHandler: () => handler, getClass: () => class DataApi {} } as never;
  const guard = new IntegrationApiKeyGuard(new Reflector(), repository as never, audit as never);
  await assert.rejects(guard.canActivate(context));
});

test('revocation does not commit when its audit write fails', async () => {
  let committed = false;
  const staged = { revoked: false };
  const repository = {
    transaction: async (work: (tx: object) => Promise<unknown>) => {
      const result = await work(staged);
      committed = true;
      return result;
    },
    findApiKeyById: async () => ({ id: 'key-rollback', name: 'Rollback', keyPrefix: 'prefix', scopes: ['tasks:read'], branchIds: ['branch-1'], allBranches: false }),
    revokeApiKey: async () => { staged.revoked = true; return true; },
  };
  const service = new IntegrationsService(repository as never, {} as never, {} as never, {} as never, undefined,
    { record: async () => { throw new Error('audit unavailable'); } } as never);
  await assert.rejects(service.revokeDataApiKey('key-rollback', { actorId: 'admin-1' }));
  assert.equal(committed, false);
});

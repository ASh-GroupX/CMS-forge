import assert from 'node:assert/strict';
import test from 'node:test';
import type { AuthenticatedRequest } from '../../core/auth.guard.js';
import { SearchController } from './search.controller.js';
import type { SearchService } from './search.service.js';

test('search controller derives scope from the authenticated principal', async () => {
  let actor: unknown;
  const service = { search: async (_query: unknown, value: unknown) => { actor = value; return { items: [], query: 'ab', limit: 8 }; } } as unknown as SearchService;
  const request = { principal: { userId: 'user_1', roleCode: 'STAFF', branchId: 'branch_1' } } as AuthenticatedRequest;
  await new SearchController(service).search({ q: 'ab' }, request);
  assert.deepEqual(actor, { userId: 'user_1', roleCode: 'STAFF', branchId: 'branch_1' });
});

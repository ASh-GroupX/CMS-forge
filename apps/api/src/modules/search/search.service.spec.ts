import assert from 'node:assert/strict';
import test from 'node:test';
import type { SearchRepository } from './search.repository.js';
import { SearchService } from './search.service.js';

const actor = { userId: 'user_1', roleCode: 'STAFF', branchId: 'branch_1' };

test('search validates the query and enforces the overall result limit', async () => {
  const repository = { search: async (type: string) => [{ type, id: type, label: type, labelAr: type, context: '', contextAr: '', href: '/' }] } as unknown as SearchRepository;
  const result = await new SearchService(repository).search({ q: 'customer', types: 'COMPLAINT,TASK', limit: '1' }, actor);
  assert.equal(result.items.length, 1);
  assert.equal(result.limit, 1);
});

test('search rejects short queries', async () => {
  const repository = { search: async () => [] } as unknown as SearchRepository;
  await assert.rejects(() => new SearchService(repository).search({ q: 'x' }, actor), /Invalid search query/);
});

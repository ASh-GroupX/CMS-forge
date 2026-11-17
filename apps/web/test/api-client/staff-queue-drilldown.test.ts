import assert from 'node:assert/strict';
import test from 'node:test';
import { getStaffQueueLoadResult } from '../../src/lib/staff-queue-api';

test('complaint queue forwards dashboard drill-down filters to the scoped search endpoint', async () => {
  let requestedUrl = '';
  const result = await getStaffQueueLoadResult({
    apiUrl: 'http://api.test',
    cookieHeader: 'cms_staff_session=session',
    query: { isJustified: 'false', satisfactionStatus: 'UNSATISFIED' },
    fetchImpl: async (input) => {
      requestedUrl = String(input);
      return new Response(JSON.stringify({ items: [] }), { status: 200, headers: { 'content-type': 'application/json' } });
    },
  });

  const url = new URL(requestedUrl);
  assert.equal(url.pathname, '/complaints/search');
  assert.equal(url.searchParams.get('isJustified'), 'false');
  assert.equal(url.searchParams.get('satisfactionStatus'), 'UNSATISFIED');
  assert.deepEqual(result, { status: 'ready', data: { hasNext: false, page: 1, pageSize: 10, rows: [] } });
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { GET } from '../../src/app/(staff)/reports/export/route';

test('report export route proxies valid formats with staff cookies', async () => {
  const originalFetch = globalThis.fetch;
  const originalApiUrl = process.env.API_URL;
  process.env.API_URL = 'http://api.test';
  try {
    globalThis.fetch = async (input, init) => {
      assert.equal(String(input), 'http://api.test/reports/export?format=csv&branchId=branch_report&categoryId=cat_report&ownerId=usr_report');
      assert.equal((init?.headers as Record<string, string>).cookie, 'cms_staff_session=session');
      return new Response('id\n1\n', {
        headers: {
          'content-disposition': 'attachment; filename="reports.csv"',
          'content-type': 'text/csv',
        },
      });
    };

    const response = await GET(new Request('http://web.test/reports/export?format=csv&branchId=branch_report&categoryId=cat_report&ownerId=usr_report', {
      headers: { cookie: 'cms_staff_session=session' },
    }));

    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-type'), 'text/csv');
    assert.equal(await response.text(), 'id\n1\n');
  } finally {
    globalThis.fetch = originalFetch;
    if (originalApiUrl === undefined) delete process.env.API_URL;
    else process.env.API_URL = originalApiUrl;
  }
});

test('report export route rejects unknown formats before the API call', async () => {
  const response = await GET(new Request('http://web.test/reports/export?format=pdf'));

  assert.equal(response.status, 400);
});

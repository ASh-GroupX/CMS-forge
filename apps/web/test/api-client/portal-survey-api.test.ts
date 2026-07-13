import assert from 'node:assert/strict';
import test from 'node:test';
import { POST as proxyPortalPost } from '../../src/app/api/portal/[...path]/route';
import { submitPortalSurvey, terminalSurveyState } from '../../src/lib/portal-survey-api';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' }, status });
}

test('portal survey client submits rating through public proxy without client authority', async () => {
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  const result = await submitPortalSurvey({
    key: 'survey_secret',
    rating: 5,
    comment: 'Resolved well',
    fetchImpl: async (input, init) => {
      calls.push({ input, init });
      return jsonResponse({ survey: { id: 'survey_1', rating: 5, submittedAt: '2026-06-19T10:00:00.000Z' } });
    },
  });

  assert.equal(result.ok, true);
  assert.equal(calls[0]?.input, '/api/portal/surveys');
  assert.equal(calls[0]?.init?.method, 'POST');
  assert.deepEqual(JSON.parse(String(calls[0]?.init?.body)), { surveyToken: 'survey_secret', rating: 5, comment: 'Resolved well' });
  assert.doesNotMatch(String(calls[0]?.init?.body), /role|actor|branch|workflow|password|credential/i);
});

test('portal survey client maps terminal backend states', async () => {
  assert.equal(terminalSurveyState('SURVEY_TOKEN_USED'), 'used');
  assert.equal(terminalSurveyState('SURVEY_TOKEN_EXPIRED'), 'expired');
  assert.equal(terminalSurveyState('PORTAL_VERIFICATION_FAILED'), 'error');

  const result = await submitPortalSurvey({
    key: 'expired',
    rating: 4,
    fetchImpl: async () => jsonResponse({ error: { code: 'SURVEY_TOKEN_EXPIRED', message: 'Portal verification failed' } }, 400),
  });

  assert.equal(result.ok, false);
  assert.equal(result.ok ? null : result.code, 'SURVEY_TOKEN_EXPIRED');
});

test('portal survey proxy forwards only json body to public API route', async () => {
  const priorFetch = globalThis.fetch;
  const priorApiUrl = process.env.API_URL;
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  globalThis.fetch = (async (input, init) => {
    calls.push({ input, init });
    return jsonResponse({ survey: { id: 'survey_1', rating: 5, submittedAt: '2026-06-19T10:00:00.000Z' } });
  }) as typeof fetch;
  process.env.API_URL = 'http://api.test';

  try {
    const body = { surveyToken: 'survey_secret', rating: 5, comment: 'Resolved well', actorId: 'spoofed' };
    const response = await proxyPortalPost(new Request('http://web.test/api/portal/surveys', {
      body: JSON.stringify(body),
      headers: { 'content-type': 'application/json', cookie: 'cms_staff_session=ignored', 'x-portal-session': 'ignored' },
      method: 'POST',
    }), { params: Promise.resolve({ path: ['surveys'] }) });

    assert.equal(response.status, 200);
    assert.equal(String(calls[0]?.input), 'http://api.test/portal/surveys');
    assert.equal(calls[0]?.init?.body, JSON.stringify(body));
    assert.deepEqual(Object.fromEntries(new Headers(calls[0]?.init?.headers).entries()), {
      accept: 'application/json',
      'content-type': 'application/json',
    });
  } finally {
    globalThis.fetch = priorFetch;
    if (priorApiUrl === undefined) delete process.env.API_URL;
    else process.env.API_URL = priorApiUrl;
  }
});

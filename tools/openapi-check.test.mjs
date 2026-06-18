import assert from 'node:assert/strict';
import test from 'node:test';
import { canonicalOpenApiText, checkOpenApiText } from './openapi-check.mjs';

test('openapi check accepts the canonical scaffold', () => {
  assert.deepEqual(checkOpenApiText(canonicalOpenApiText()), []);
});

test('openapi check rejects missing baseline error schemas', () => {
  const text = `${JSON.stringify({
    openapi: '3.1.0',
    info: { title: 'CMS-Auto API', version: '0.1.0' },
    paths: {},
    components: { schemas: {} },
  }, null, 2)}\n`;

  assert.ok(checkOpenApiText(text).includes('OpenAPI document missing ErrorEnvelope schema'));
});

test('openapi check rejects non-canonical drift', () => {
  const text = canonicalOpenApiText().replace('"paths": {}', '"paths": {\n    "/drift": {}\n  }');

  assert.ok(checkOpenApiText(text).includes('OpenAPI document is not canonical; run corepack pnpm openapi:generate'));
});

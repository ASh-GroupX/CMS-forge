import assert from 'node:assert/strict';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

test('ticket phone generated client and endpoint schemas stay in sync', () => {
  const result = spawnSync(process.execPath, ['tools/generate-ticket-phone-client.mjs', '--check'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const document = JSON.parse(readFileSync('tools/openapi-canonical.json', 'utf8'));
  const endpoint = document.paths['/internal-tickets/phone-duplicates'].post;
  assert.deepEqual(endpoint.security, [{ staffSession: [] }]);
  assert.ok(endpoint.responses['200']);
  assert.equal(document.components.schemas.TicketPhoneDuplicateResponse.properties.items.maxItems, 20);
  assert.ok(document.paths['/internal-tickets'].post.responses['409']);
  assert.ok(document.components.schemas.CreateDepartmentTicketPhoneCustomField.properties.phoneDuplicateCheck);
});

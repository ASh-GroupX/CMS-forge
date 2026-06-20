import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { redactEmail, runSmtpArrivalProof, safeProofResult } from './smtp-arrival-proof.mjs';

test('smtp arrival proof redacts recipient metadata', () => {
  const result = safeProofResult('proof_1', 'customer@example.com', {
    provider: 'smtp',
    accepted: ['customer@example.com'],
    messageId: 'smtp_1',
  });

  assert.deepEqual(result, {
    proofId: 'proof_1',
    provider: 'smtp',
    recipient: 'c***@example.com',
    recipientDomain: 'example.com',
    accepted: ['c***@example.com'],
    messageIdPresent: true,
  });
  assert.equal(redactEmail('not-an-email'), '[redacted]');
});

test('smtp arrival proof uses injected provider without exposing raw recipient', async () => {
  let messageTo = '';
  const output = [];
  const status = await runSmtpArrivalProof({
    env: { SMTP_PROOF_TO: 'pilot@example.com' },
    providerFactory: () => ({
      async send(input) {
        messageTo = input.to;
        return { provider: 'smtp', accepted: [input.to], messageId: 'smtp_1' };
      },
    }),
    stdout: { write: (value) => output.push(value) },
    stderr: { write: () => undefined },
  });

  assert.equal(status, 0);
  assert.equal(messageTo, 'pilot@example.com');
  assert.match(output.join(''), /p\*\*\*@example\.com/);
  assert.doesNotMatch(output.join(''), /pilot@example\.com/);
});

test('smtp arrival proof failure output is secret-safe', async () => {
  const errors = [];
  const status = await runSmtpArrivalProof({
    env: { SMTP_PROOF_TO: 'pilot@example.com', SMTP_PASSWORD: 'smtp-secret-value' },
    providerFactory: () => {
      throw new Error('smtp-secret-value');
    },
    stdout: { write: () => undefined },
    stderr: { write: (value) => errors.push(value) },
  });

  const response = errors.join('');
  assert.equal(status, 1);
  assert.doesNotMatch(response, /smtp-secret-value|password|token|credential/i);
});

test('smtp arrival proof CLI fails safely when env is missing', () => {
  const result = spawnSync(process.execPath, ['--import', 'tsx', 'tools/smtp-arrival-proof.mjs'], {
    cwd: process.cwd(),
    env: { PATH: process.env.PATH ?? '' },
    encoding: 'utf8',
  });

  assert.notEqual(result.status, 0);
  assert.doesNotMatch(result.stderr, /password|token|credential|secret/i);
});

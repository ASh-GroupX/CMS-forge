import assert from 'node:assert/strict';
import test from 'node:test';
import { runSecurityCheck, securityProofCommands } from './security-check.mjs';

test('security check selects real security suites instead of pending proof', () => {
  const commands = securityProofCommands('node');
  const labels = commands.map((command) => command.label);
  const flatArgs = commands.flatMap((command) => command.args);

  assert.deepEqual(labels, [
    'api auth session/password/reset security',
    'api admin RBAC and CSRF security',
    'api CSRF and rate-limit security',
    'api audit redaction and RBAC',
    'portal submission privacy security',
    'portal tracking verification privacy',
    'attachment authorization and scan policy',
    'report authorization and scoped export security',
  ]);
  assert.equal(flatArgs.includes('tools/pending-proof.mjs'), false);
});

test('security check stops and returns nonzero when a child suite fails', () => {
  const calls = [];
  const result = runSecurityCheck({
    commands: [
      { label: 'first suite', command: 'node', args: ['first'] },
      { label: 'second suite', command: 'node', args: ['second'] },
    ],
    runner: (command, args) => {
      calls.push([command, args]);
      return { status: calls.length === 1 ? 0 : 1 };
    },
    logger: { log() {}, error() {} },
    stdio: 'pipe',
  });

  assert.deepEqual(result, { failed: 'second suite', status: 1 });
  assert.deepEqual(calls, [['node', ['first']], ['node', ['second']]]);
});

test('security check returns zero after all child suites pass', () => {
  const result = runSecurityCheck({
    commands: [{ label: 'only suite', command: 'node', args: ['suite'] }],
    runner: () => ({ status: 0 }),
    logger: { log() {}, error() {} },
    stdio: 'pipe',
  });

  assert.deepEqual(result, { status: 0 });
});

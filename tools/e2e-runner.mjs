import { spawnSync } from 'node:child_process';

const mode = process.argv.slice(2).find((arg) => arg !== '--');
const webModes = new Set(['visual', 'accessibility', 'perf', 'ui-smoke']);

if (!mode) {
  run('node', ['--import', 'tsx', 'tools/web-proof.mjs', 'ui-smoke']);
  run('node', ['tools/runtime-smoke.mjs']);
  process.exit(0);
}

if (webModes.has(mode)) {
  run('node', ['--import', 'tsx', 'tools/web-proof.mjs', mode]);
  process.exit(0);
}

if (mode === 'runtime-smoke') {
  run('node', ['tools/runtime-smoke.mjs']);
  process.exit(0);
}

if (mode === 'customer-portal-track') {
  run('node', ['--import', 'tsx', 'tools/customer-portal-track-proof.mjs']);
  process.exit(0);
}

if (mode === 'customer-portal-submit') {
  run('node', ['--import', 'tsx', 'tools/customer-portal-submit-proof.mjs']);
  process.exit(0);
}

if (mode === 'complaint-workflow') {
  run('node', ['--import', 'tsx', 'tools/complaint-workflow-proof.mjs']);
  process.exit(0);
}

if (mode === 'attachments') {
  run('node', ['--import', 'tsx', 'tools/attachments-proof.mjs']);
  process.exit(0);
}

if (mode === 'work-queues') {
  run('node', ['--import', 'tsx', 'tools/work-queues-proof.mjs']);
  process.exit(0);
}

if (mode === 'task-board-dnd') {
  run('node', ['--import', 'tsx', 'tools/task-board-dnd-proof.mjs']);
  process.exit(0);
}

console.error('Use one of: visual, accessibility, perf, ui-smoke, runtime-smoke, customer-portal-track, customer-portal-submit, complaint-workflow, attachments, work-queues, task-board-dnd.');
process.exit(1);

function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

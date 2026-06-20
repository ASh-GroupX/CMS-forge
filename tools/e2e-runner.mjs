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

console.error('Use one of: visual, accessibility, perf, ui-smoke, runtime-smoke.');
process.exit(1);

function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

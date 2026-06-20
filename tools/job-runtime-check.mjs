import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const apiSrc = 'apps/api/src';

// Background-job entrypoints that MUST be invoked by a runtime driver - a scheduler,
// a queue worker, or an ops route. A job with no caller is dead at runtime: the
// failure no static or unit gate can see (it is why SLA timers, notification
// dispatch, and attachment scans never ran). Extend this registry when a new
// background job is added.
const backgroundJobs = [
  { file: 'modules/sla/sla.service.ts', method: 'runWarningJob' },
  { file: 'modules/sla/sla.service.ts', method: 'runBreachJob' },
  { file: 'modules/notifications/notifications.service.ts', method: 'dispatchQueuedEmail' },
  { file: 'modules/notifications/notifications.service.ts', method: 'dispatchQueuedSms' },
  { file: 'modules/notifications/notifications.service.ts', method: 'dispatchQueuedWhatsApp' },
  { file: 'modules/attachments/attachments.service.ts', method: 'transitionScanStatus' },
];

// Ratchet of documented runtime debt: jobs that exist but have no driver yet. It may
// only SHRINK. A NEW orphaned job must fail this gate, never be added here. Remove an
// entry the moment a runner (under apps/api/src/worker, a *.runner.ts/*.scheduler.ts
// file, or an ops route) actually invokes the job. Keyed as "<file>:<method>".
const knownUndrivenJobs = new Set();

function walkTs(root, dir, acc) {
  if (!existsSync(join(root, dir))) {
    return acc;
  }
  for (const entry of readdirSync(join(root, dir), { withFileTypes: true })) {
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) {
      walkTs(root, rel, acc);
    } else if (rel.endsWith('.ts')) {
      acc.push(rel);
    }
  }
  return acc;
}

// A job is "driven" when some non-test file other than its own definition calls it.
// Tests calling the job directly do not count - that is exactly how an undriven job
// stays inside coverage while never running in the app.
function isDriven(root, files, job) {
  const callSite = new RegExp(`\\.${job.method}\\s*\\(`);
  const ownFile = `${apiSrc}/${job.file}`;
  return files.some(
    (file) =>
      file !== ownFile &&
      !/\.(spec|test)\.ts$/.test(file) &&
      callSite.test(readFileSync(join(root, file), 'utf8')),
  );
}

export function checkJobRuntime(root = process.cwd(), undriven = knownUndrivenJobs, jobs = backgroundJobs) {
  if (!existsSync(join(root, apiSrc))) {
    return [];
  }
  const files = walkTs(root, apiSrc, []);
  const errors = [];

  for (const job of jobs) {
    const key = `${job.file.split('/').pop()}:${job.method}`;
    const driven = isDriven(root, files, job);
    if (!driven && !undriven.has(key)) {
      errors.push(
        `${apiSrc}/${job.file}: background job ${job.method}() has no runtime driver - it never runs (add a scheduler/worker/ops caller)`,
      );
    }
    if (driven && undriven.has(key)) {
      errors.push(`tools/job-runtime-check.mjs knownUndrivenJobs: "${key}" has a driver now - remove it from the allowlist`);
    }
  }

  return errors;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const errors = checkJobRuntime();
  if (errors.length > 0) {
    console.error(errors.join('\n'));
    process.exit(1);
  }
  console.log('Job runtime check passed');
}

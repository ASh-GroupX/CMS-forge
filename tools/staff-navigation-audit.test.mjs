import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = 'apps/web/src/app/(staff)';
const pages = readdirSync(root, { recursive: true }).filter(path => path.endsWith('page.tsx'));
const routes = pages.map(path => '/' + path.split(/[\\/]/).filter(segment => !segment.startsWith('(') && segment !== 'page.tsx').join('/'));
test('every staff page inherits shared navigation and authenticated owner scope', () => {
  assert.ok(pages.length >= 40);
  const layout = readFileSync(join(root, 'layout.tsx'), 'utf8');
  const shell = readFileSync('apps/web/src/app/app-shell.tsx', 'utf8');
  assert.match(layout, /<AppShell/);
  assert.match(shell, /<StaffPageNavigation owner=\{principal.userId\}/);
  assert.match(shell, /<StaffNavigationScope owner=\{principal\?\.userId/);
  for (const route of routes) {
    const root = route.split('/')[1];
    const parent = ['admin', 'reports', 'complaints', 'internal-tickets', 'tasks', 'customers', 'audit', 'communication', 'notifications', 'service-booking'].includes(root) ? `/${root}` : '/dashboard';
    assert.ok(routes.includes(parent), `${route} has no safe section route`);
  }
});
test('workflow ticket links use same-tab return context; remaining new tabs are attachment viewers', () => {
  const files = readdirSync('apps/web/src', { recursive: true }).filter(path => path.endsWith('.tsx'));
  const attachmentViewers = ['components/complaint-workspace/working-notes.tsx', 'components/complaint-workspace/index.tsx', 'app/(staff)/internal-tickets/[id]/page.tsx'];
  for (const file of files) {
    const normalized = file.replaceAll('\\', '/');
    const source = readFileSync(join('apps/web/src', file), 'utf8');
    if (source.includes('target="_blank"')) assert.ok(attachmentViewers.includes(normalized), `Unexpected new-tab workflow link in ${file}`);
  }
  const phone = readFileSync('apps/web/src/app/(staff)/internal-tickets/new/phone-rule-field.tsx', 'utf8');
  assert.match(phone, /returnTo=new-ticket/);
  assert.doesNotMatch(phone, /target="_blank"/);
  assert.doesNotMatch(readFileSync('apps/web/src/app/(staff)/internal-tickets/new/client-form.tsx', 'utf8'), /router.back\(/);
});
test('logout clears transient navigation and drafts from both staff entry points', () => {
  for (const path of ['apps/web/src/app/(staff)/layout.tsx', 'apps/web/src/app/staff-shell-panels.tsx']) {
    assert.match(readFileSync(path, 'utf8'), /<form[^>]*action=\{logoutStaffAction\}[^>]*data-staff-logout/);
  }
});

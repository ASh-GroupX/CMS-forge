import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { compileTailwind, runBrowserArtifactChecks } from './web-browser-check.mjs';
import { proofFetch } from './web-proof-fixtures.mjs';
import StaffShellPage from '../apps/web/src/app/page.tsx';
import { AppShell, staffNavItems } from '../apps/web/src/app/app-shell.tsx';
import AdminPage from '../apps/web/src/app/(staff)/admin/page.tsx';
import AuditPage from '../apps/web/src/app/(staff)/audit/page.tsx';
import ComplaintsPage from '../apps/web/src/app/(staff)/complaints/page.tsx';
import ComplaintDetailPage from '../apps/web/src/app/(staff)/complaints/[id]/page.tsx';
import DashboardPage from '../apps/web/src/app/(staff)/dashboard/page.tsx';
import DealHandoffPage from '../apps/web/src/app/(staff)/deals/handoff/page.tsx';
import EmployeeTodayPage from '../apps/web/src/app/(staff)/tasks/today/page.tsx';
import ManagerControlRoomPage from '../apps/web/src/app/(staff)/tasks/manager/page.tsx';
import ManagerTaskDetailPage from '../apps/web/src/app/(staff)/tasks/manager/[id]/page.tsx';
import NewComplaintPage from '../apps/web/src/app/(staff)/complaints/new/page.tsx';
import ReportsPage from '../apps/web/src/app/(staff)/reports/page.tsx';
import PortalSubmissionPage from '../apps/web/src/app/portal/page.tsx';
import PortalSurveyPage from '../apps/web/src/app/portal/survey/page.tsx';
import PortalTrackingPage from '../apps/web/src/app/portal/track/page.tsx';
import { StaffAuthLanding } from '../apps/web/src/app/staff-auth-landing.tsx';
import { ComplaintDetailWorkspace } from '../apps/web/src/components/complaint-detail-workspace/index.tsx';
import { ComplaintIntakeWorkspace } from '../apps/web/src/components/complaint-intake-workspace/index.tsx';
import { CommunicationGroups } from '../apps/web/src/components/communication-groups/index.tsx';
import { TaskConversation } from '../apps/web/src/components/task-conversation/index.tsx';
import { PortalShell } from '../apps/web/src/components/portal-shell/index.tsx';
import { PortalSubmissionScreen } from '../apps/web/src/components/portal-submission/index.tsx';
import { PortalSurveyScreen } from '../apps/web/src/components/portal-survey/index.tsx';
import { PortalTrackingPreview } from '../apps/web/src/components/portal-tracking/index.tsx';
import { portalSubmissionText } from '../apps/web/src/i18n/portal-submission.ts';
import { portalSurveyText } from '../apps/web/src/i18n/portal-survey.ts';
import { portalTrackingText } from '../apps/web/src/i18n/portal-tracking.ts';
import { staffShellText } from '../apps/web/src/i18n/staff-shell.ts';
import { visualCases } from './web-proof-cases.mjs';

const webRequire = createRequire(new URL('../apps/web/package.json', import.meta.url));
const React = webRequire('react');
const { renderToStaticMarkup } = webRequire('react-dom/server');
const STAFF_PROOF_PATHS = { 'staff-admin': '/admin', 'staff-audit': '/audit', 'staff-complaints': '/complaints', 'staff-complaint-detail': '/complaints/cmp-proof', 'staff-complaint-new': '/complaints/new', 'staff-deal-handoff': '/deals/handoff', 'staff-manager': '/tasks/manager', 'staff-manager-detail': '/tasks/manager/task_manager_proof', 'staff-reports': '/reports', 'staff-today': '/tasks/today', 'staff-task-detail': '/tasks/today/task-proof', 'staff-communication-groups': '/communication-groups' };
const outDir = join('coverage', 'web-visual-review');

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
compileTailwind(outDir);

const artifacts = [];
for (const testCase of visualCases) {
  const html = renderToStaticMarkup(await routePage(testCase));
  const file = `${slug(testCase.name)}.html`;
  writeFileSync(join(outDir, file), reviewHtml(testCase, html));
  artifacts.push({ ...testCase, file });
}

writeFileSync(join(outDir, 'index.html'), indexHtml(artifacts));
await runBrowserArtifactChecks(artifacts, outDir, { screenshots: true });
console.log(`Visual review artifacts written to ${outDir}`);
for (const artifact of artifacts) {
  console.log(`- ${artifact.name}: ${join(outDir, artifact.file)}`);
}

async function routePage(testCase) {
  const params = Promise.resolve(testCase.params);
  const staffProps = { cookieHeader: 'cms_staff_session=proof', fetchImpl: proofFetch, searchParams: params };
  if (testCase.route === 'staff-navigation') return React.createElement(AppShell, { activePath: '/tasks/today', locale: testCase.locale, navKeys: staffNavItems.map((item) => item.key), principal: (await proofJson('/auth/me')).user }, React.createElement('section', { className: 'min-w-0', 'aria-label': staffShellText[testCase.locale].title }, staffShellText[testCase.locale].subtitle));
  if (testCase.route === 'staff-auth') return React.createElement(StaffAuthLanding, { authError: false, locale: testCase.locale });
  if (testCase.route === 'staff-admin') return staffFrame(testCase, await AdminPage(staffProps));
  if (testCase.route === 'staff-audit') return staffFrame(testCase, await AuditPage({ searchParams: params }));
  if (testCase.route === 'staff-complaints') return staffFrame(testCase, await ComplaintsPage(staffProps));
  if (testCase.route === 'staff-complaint-detail') return staffFrame(testCase, hasAnyParam(testCase, ['attachment', 'comments', 'commentVisibility', 'detail', 'lookup', 'sla', 'tab', 'workflow'])
    ? await proofComplaintDetail(testCase)
    : await ComplaintDetailPage({ ...staffProps, params: Promise.resolve({ id: 'cmp-proof' }) }));
  if (testCase.route === 'staff-complaint-new') return staffFrame(testCase, hasAnyParam(testCase, ['create', 'lookup'])
    ? React.createElement(ComplaintIntakeWorkspace, { createState: testCase.params.create, locale: testCase.locale, lookupState: testCase.params.lookup, options: await proofJson('/complaints/form-options') })
    : await NewComplaintPage({ searchParams: params }));
  if (testCase.route === 'staff-dashboard') return React.createElement(AppShell, { activePath: '/dashboard', locale: testCase.locale, navKeys: staffNavItems.map((item) => item.key), principal: (await proofJson('/auth/me')).user }, await DashboardPage(staffProps));
  if (testCase.route === 'staff-deal-handoff') return staffFrame(testCase, await DealHandoffPage(staffProps));
  if (testCase.route === 'staff-manager') return staffFrame(testCase, await ManagerControlRoomPage(staffProps));
  if (testCase.route === 'staff-manager-detail') return staffFrame(testCase, await ManagerTaskDetailPage({ ...staffProps, params: Promise.resolve({ id: 'task_manager_proof' }) }));
    if (testCase.route === 'staff-reports') return staffFrame(testCase, await ReportsPage(staffProps));
    if (testCase.route === 'staff-today') return staffFrame(testCase, await EmployeeTodayPage(staffProps));
    if (testCase.route === 'staff-task-detail') return staffFrame(testCase, React.createElement(TaskConversation, { comments: proofTaskComments(), locale: testCase.locale, task: proofTask() }));
    if (testCase.route === 'staff-communication-groups') return staffFrame(testCase, React.createElement(CommunicationGroups, { data: proofCommunicationGroups(), loadState: 'ready', locale: testCase.locale }));
  if (testCase.route === 'portal-submission') return testCase.params.state
    ? portalFrame(testCase, 'submit', React.createElement(PortalSubmissionScreen, { locale: testCase.locale, reference: testCase.params.reference, state: testCase.params.state }))
    : PortalSubmissionPage({ searchParams: params });
  if (testCase.route === 'portal-tracking-preview') return portalFrame(testCase, 'track', React.createElement(PortalTrackingPreview, portalTrackingProps(testCase)));
  if (testCase.route === 'portal-tracking') return PortalTrackingPage({ searchParams: params });
  if (testCase.route === 'portal-survey') return testCase.params.state
    ? portalFrame(testCase, 'survey', React.createElement(PortalSurveyScreen, { locale: testCase.locale, state: testCase.params.state, surveyKey: 'proof-survey' }))
    : PortalSurveyPage({ searchParams: params });
  return StaffShellPage({ searchParams: params });
}

async function proofComplaintDetail(testCase) {
  const [{ complaint }, options, { staff }] = await Promise.all([
    proofJson('/complaints/cmp-proof'),
    proofJson('/complaints/form-options'),
    proofJson('/staff/assignable'),
  ]);
  return React.createElement(ComplaintDetailWorkspace, {
    attachmentState: testCase.params.attachment,
    commentVisibility: testCase.params.commentVisibility,
    commentsState: testCase.params.comments,
    detail: proofDetail(complaint, testCase),
    initialTab: testCase.params.tab,
    locale: testCase.locale,
    lookupState: testCase.params.lookup,
    options,
    relations: proofRelations(),
    staff,
    state: testCase.params.detail,
    workflowState: testCase.params.workflow,
  });
}

async function proofJson(path) {
  return (await proofFetch(new URL(path, 'http://localhost:3000'))).json();
}

function hasAnyParam(testCase, names) {
  return names.some((name) => testCase.params[name]);
}

function proofRelations() {
  return {
    candidates: [{ id: 'cmp_rel', referenceNumber: 'CMP-PROOF-REL-001', status: 'IN_PROGRESS', severity: 'HIGH', subject: 'Related proof complaint', branchName: 'Proof branch', customerName: 'Proof Customer', createdAt: '2026-06-18T00:00:00.000Z', updatedAt: '2026-06-20T00:00:00.000Z' }],
    related: [],
    state: 'ready',
    windowDays: 30,
  };
}

function proofTask() { return { id: 'task-proof', title: 'متابعة العميل', status: 'OPEN', ownerId: 'owner-proof', assigneeId: 'assignee-proof', assigneeName: 'المسؤول', dueAt: '2026-07-14T10:00:00.000Z', nextAction: { what: 'الاتصال بالعميل', whoId: 'assignee-proof', when: '2026-07-14T10:00:00.000Z' }, links: [{ entityType: 'COMPLAINT', entityId: 'cmp-proof' }] }; }
function proofTaskComments() { return [{ id: 'comment-proof', taskId: 'task-proof', authorId: 'owner-proof', authorName: 'الموظف', body: 'يرجى متابعة العميل اليوم.', mentions: [{ userId: 'assignee-proof', name: 'Employee', nameAr: 'المسؤول', source: 'USER', sourceLabel: 'Employee' }], createdAt: '2026-07-13T09:00:00.000Z' }]; }
function proofCommunicationGroups() { return { items: [{ id: 'group-proof', name: 'فريق المتابعة', visibility: 'PERSONAL', ownerId: 'owner-proof', members: [{ userId: 'assignee-proof', displayName: 'Employee', displayNameAr: 'المسؤول' }], createdAt: '2026-07-13T00:00:00.000Z', updatedAt: '2026-07-13T00:00:00.000Z' }], eligibleMembers: [{ userId: 'assignee-proof', displayName: 'Employee', displayNameAr: 'المسؤول' }], canManageShared: true }; }
function proofDetail(complaint, testCase) {
  return {
    ...complaint,
    ...(testCase.params.sla === 'missing' ? { slaPercentElapsed: undefined } : {}),
    allowedActions: complaint.allowedActions ?? ['ACCEPT_INTAKE', 'ASSIGN_INVESTIGATION', 'REJECT_AS_INVALID'],
    capaActions: complaint.capaActions ?? [],
    caseTimeline: complaint.caseTimeline ?? [],
    communicationTimeline: complaint.communicationTimeline ?? [],
  };
}

function portalTrackingProps(testCase) {
  return {
    locale: testCase.locale,
    reference: testCase.params.reference ?? portalTrackingText[testCase.locale].sample.reference,
    state: testCase.params.state,
  };
}

async function staffFrame(testCase, children) {
  const activePath = STAFF_PROOF_PATHS[testCase.route] ?? '/dashboard';
  return React.createElement(AppShell, { activePath, locale: testCase.locale, navKeys: staffNavItems.map((item) => item.key), principal: (await proofJson('/auth/me')).user }, children);
}

function portalFrame(testCase, current, children) {
  const t = current === 'submit' ? portalSubmissionText[testCase.locale] : current === 'track' ? portalTrackingText[testCase.locale] : portalSurveyText[testCase.locale];
  const switchLocale = testCase.locale === 'ar' ? 'en' : 'ar';
  const switchPath = current === 'submit' ? '/portal' : current === 'track' ? '/portal/track' : '/portal/survey';
  return React.createElement(PortalShell, {
    current,
    locale: testCase.locale,
    privacy: t.privacy,
    subtitle: t.subtitle,
    switchHref: `${switchPath}?locale=${switchLocale}`,
    switchLabel: t.switchLabel,
    switchTarget: t.switchTarget,
    title: t.title,
  }, children);
}

function reviewHtml(testCase, renderedHtml) {
  const signals = (testCase.signals ?? []).map((signal) => `<li>${escapeHtml(signal)}</li>`).join('');
  const frameStyle = testCase.viewport?.width ? ` style="max-width:${testCase.viewport.width}px"` : '';
  return `<!doctype html>
<html lang="${testCase.locale}">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(testCase.name)}</title>
  <link rel="stylesheet" href="./proof.css" />
  <style>
    aside.review-chrome { padding: 12px 16px; border-bottom: 1px solid hsl(var(--border)); background: hsl(var(--surface-raised)); }
    main { padding: 16px; }
    .frame { margin: 0 auto; outline: 1px solid hsl(var(--border)); }
  </style>
</head>
<body>
  <aside class="review-chrome">
    <strong>${escapeHtml(testCase.name)}</strong>
    <p>Inspect layout, overflow, RTL/LTR direction, labels, and state messaging before approving golden-screen work.</p>
    <ul>${signals}</ul>
  </aside>
  <main><div class="frame"${frameStyle}>${renderedHtml}</div></main>
</body>
</html>`;
}

function indexHtml(artifacts) {
  const links = artifacts
    .map((artifact) => `<li><a href="./${artifact.file}">${escapeHtml(artifact.name)}</a> &middot; <a href="./${artifact.file.replace(/\.html$/, '.png')}">PNG</a></li>`)
    .join('');
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8" /><title>CMS-Auto Visual Review</title><link rel="stylesheet" href="./proof.css" /></head>
<body><h1>CMS-Auto Visual Review</h1><ul>${links}</ul></body>
</html>`;
}

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

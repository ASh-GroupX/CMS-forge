import { adminHubText } from '../apps/web/src/i18n/staff-admin-hub.ts';
import { auditViewerText } from '../apps/web/src/i18n/staff-audit-viewer.ts';
import { complaintDetailText } from '../apps/web/src/i18n/staff-complaint-detail.ts';
import { complaintCommentText } from '../apps/web/src/i18n/staff-complaint-detail.ts';
import { communicationGroupsText } from '../apps/web/src/i18n/staff-communication-groups.ts';
import { complaintRelationsText } from '../apps/web/src/i18n/staff-complaint-relations.ts';
import { collaborationText } from '../apps/web/src/i18n/staff-collaboration.ts';
import { complaintBoardText } from '../apps/web/src/i18n/staff-complaint-board.ts';
import { complaintTabsText } from '../apps/web/src/i18n/staff-complaint-tabs.ts';
import { dealHandoffText } from '../apps/web/src/i18n/staff-deal-handoff.ts';
import { employeeTodayText } from '../apps/web/src/i18n/staff-employee-today.ts';
import { managerControlRoomText } from '../apps/web/src/i18n/staff-manager-control-room.ts';
import { modernUiText } from '../apps/web/src/i18n/staff-modern-ui.ts';
import { portalSubmissionText } from '../apps/web/src/i18n/portal-submission.ts';
import { portalSurveyText } from '../apps/web/src/i18n/portal-survey.ts';
import { portalTrackingText } from '../apps/web/src/i18n/portal-tracking.ts';
import { reportsDashboardText } from '../apps/web/src/i18n/staff-reports-dashboard.ts';
import { staffShellText } from '../apps/web/src/i18n/staff-shell.ts';
import { staffAssignmentText } from '../apps/web/src/i18n/staff-assignment.ts';
import { taskBoardText } from '../apps/web/src/i18n/staff-task-board.ts';
import { taskConversationText } from '../apps/web/src/i18n/staff-task-conversation.ts';

export const smokeCases = [
  { name: 'English admin shell', locale: 'en', params: { locale: 'en', role: 'admin', session: 'signed-in', admin: 'success', dashboard: 'loading', notification: 'success', reports: 'ready' } },
  { name: 'Arabic management shell', locale: 'ar', params: { locale: 'ar', role: 'management', session: 'signed-in', comments: 'error', queue: 'empty', reports: 'denied' } },
];

export const visualCases = [...['en', 'ar'].flatMap((locale) => [...buildVisualCases(locale), ...buildPortalVisualCases(locale)]), ...buildEnglishResponsiveCases(), ...buildArabicResponsiveCases()];
export const accessibilityCases = buildAccessibilityCases();
export const performanceCases = buildPerformanceCases();

export function defaultVisualSignals(locale) {
  const t = staffShellText[locale], reports = reportsDashboardText[locale];
  return [t.title, t.nav.dashboard[0], t.nav.queue[0], t.nav.notifications[0], reports.title, reports.export.title];
}

function buildVisualCases(locale) {
  const t = staffShellText[locale], collaboration = collaborationText[locale], detail = complaintDetailText[locale], comment = complaintCommentText[locale], groups = communicationGroupsText[locale], relations = complaintRelationsText[locale], tabs = complaintTabsText[locale], task = taskConversationText[locale];
  const base = { locale, role: 'admin', session: 'signed-in' };
  return [
    visualCase('auth landing', locale, 'staff-auth', { locale }, [t.title, t.auth.loginTitle, t.nav.queue[0]], ['lg:grid-cols-[minmax(0,1fr)_minmax(24rem,32rem)]', 'bg-surface-raised']),
    visualCase('staff shell', locale, 'staff', { ...base }, [t.title, t.nav.today[0], t.workQueue.title], ['lg:grid-cols-[18rem_minmax(0,1fr)]', 'bg-surface-raised']),
    visualCase('today tasks', locale, 'staff-today', { ...base }, [employeeTodayText[locale].title, employeeTodayText[locale].sections.overdue[0], employeeTodayText[locale].help.waiting, employeeTodayText[locale].actions.updateDetails, 'TASK-PROOF-001'], ['<details', 'bg-surface-raised']),
    visualCase('task board', locale, 'staff-board', { ...base }, [taskBoardText[locale].title, taskBoardText[locale].subtitle, taskBoardText[locale].columnEmpty, taskBoardText[locale].card.promise, taskBoardText[locale].card.dueStates.OVERDUE, taskBoardText[locale].manage.open, 'BOARD-PROOF-001', 'BOARD-PROOF-004'], ['bg-board-column', 'bg-board-card', 'overflow-x-auto', 'snap-x']),
    visualCase('ticket board', locale, 'staff-complaint-board', { ...base }, [complaintBoardText[locale].title, complaintBoardText[locale].subtitle, complaintBoardText[locale].columnEmpty, complaintBoardText[locale].card.severity.CRITICAL, complaintBoardText[locale].card.sla.BREACHED, 'CMP-BOARD-001', 'CMP-BOARD-004'], ['bg-board-column', 'bg-board-card', 'overflow-x-auto', 'snap-x']),
    visualCase('manager control room', locale, 'staff-manager', { ...base }, [managerControlRoomText[locale].title, managerControlRoomText[locale].sections.dueToday[0], managerControlRoomText[locale].openDetail, 'TASK-MANAGER-PROOF'], ['xl:grid-cols-2', 'min-h-11']),
    visualCase('manager task detail', locale, 'staff-manager-detail', { ...base }, ['TASK-MANAGER-PROOF', managerControlRoomText[locale].fields.nextAction, managerControlRoomText[locale].back], ['sm:grid-cols-2', 'min-h-11']),
    visualCase('dashboard', locale, 'staff-dashboard', { ...base }, [modernUiText[locale].dashboard.attention, modernUiText[locale].dashboard.mainIndicators, modernUiText[locale].dashboard.recentUpdates], ['xl:grid-cols-[minmax(0,1.45fr)_minmax(20rem,1fr)]', 'sm:grid-cols-2']),
    visualCase('work queue', locale, 'staff-complaints', { ...base }, [t.workQueue.title, t.workQueue.filterHelp, 'CMP-PROOF-001', t.workQueue.pagination.page], ['md:grid-cols-6', 'overflow-x-auto']),
    visualCase('deal handoff', locale, 'staff-deal-handoff', { ...base }, [dealHandoffText[locale].title, dealHandoffText[locale].sections.stuck[0], dealHandoffText[locale].actions.updateDetails, staffAssignmentText[locale].user, staffAssignmentText[locale].department, 'DEAL-PROOF-001'], ['<details', 'bg-surface-raised']),
    visualCase('complaint create', locale, 'staff-complaint-new', { ...base, create: 'validation', lookup: 'match' }, [t.createForm.title, t.lookup.states.match, t.lookup.actions.useMatch, t.createForm.validation.vinRequired], ['md:grid-cols-2', 'md:col-span-2']),
    visualCase('complaint detail', locale, 'staff-complaint-detail', { ...base, attachment: 'clean', lookup: 'multiple', tab: 'details' }, [detail.title, tabs.details, detail.sections.customer, detail.sections.attachments, tabs.dms, t.lookup.states.multiple, relations.title], ['2xl:grid-cols-2', 'grid-cols-3']),
    visualCase('complaint collaboration', locale, 'staff-complaint-detail', { ...base, tab: 'communication' }, [detail.title, tabs.communication, collaboration.additions], ['xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]', 'border-line-subtle']),
    visualCase('public complaint composer', locale, 'staff-complaint-detail', { ...base, commentVisibility: 'PUBLIC', tab: 'communication' }, [detail.title, collaboration.publicWarning, collaboration.publicCta], ['bg-status-warning', 'border-line-subtle']),
    visualCase('task conversation', locale, 'staff-task-detail', { ...base }, [task.title, task.responsible, collaboration.additions], ['bg-surface-raised', 'border-line-subtle']),
    visualCase('communication groups', locale, 'staff-communication-groups', { ...base }, [groups.title, groups.personal, groups.shared, groups.create], ['bg-surface-raised', 'border-line-subtle']),
    visualCase('complaint detail missing SLA percent', locale, 'staff-complaint-detail', { ...base, sla: 'missing', tab: 'work' }, [detail.title, tabs.deadlineState, detail.sections.ownership], ['xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.55fr)]']),
    visualCase('workflow action panel', locale, 'staff-complaint-detail', { ...base, tab: 'work', workflow: 'validation' }, [detail.sections.workflow, detail.workflow.actions[0], detail.workflow.validation], [`aria-label="${detail.sections.workflow}"`, 'border-line-subtle']),
    visualCase('admin surfaces', locale, 'staff-admin', { ...base }, [adminHubText[locale].title, adminHubText[locale].workspaces.users[0], adminHubText[locale].workspaces.roles[0], adminHubText[locale].workspaces.branches[0], adminHubText[locale].workspaces.categories[0], adminHubText[locale].open], ['md:grid-cols-2', 'xl:grid-cols-3']),
    visualCase('reports', locale, 'staff-reports', { ...base }, [reportsDashboardText[locale].title, reportsDashboardText[locale].export.title, reportsDashboardText[locale].kpis.slaBreachRate, reportsDashboardText[locale].kpis.agingOverSeven, 'CMP-PROOF-RPT-001'], ['min-w-[56rem]', 'md:grid-cols-3']),
    visualCase('audit viewer', locale, 'staff-audit', { ...base, admin: 'success' }, [auditViewerText[locale].title, auditViewerText[locale].filters.correlationId, auditViewerText[locale].filters.export], ['xl:grid-cols-5']),
  ];
}

function buildEnglishResponsiveCases() {
  const locale = 'en', base = { locale, role: 'admin', session: 'signed-in' }, viewport = { width: 390 };
  return [
    { ...visualCase('reports 390px', locale, 'staff-reports', base, [reportsDashboardText.en.title, reportsDashboardText.en.export.title, 'CMP-PROOF-RPT-001'], []), viewport },
    { ...visualCase('audit 390px', locale, 'staff-audit', { ...base, admin: 'success' }, [auditViewerText.en.title, auditViewerText.en.filters.export], []), viewport },
    { ...visualCase('manager control room 390px', locale, 'staff-manager', base, [managerControlRoomText.en.title, 'TASK-MANAGER-PROOF'], []), viewport },
    { ...visualCase('task board 390px', locale, 'staff-board', base, [taskBoardText.en.title, taskBoardText.en.view.list, 'BOARD-PROOF-001'], ['snap-x', 'min-h-11']), viewport },
    { ...visualCase('manager task detail 390px', locale, 'staff-manager-detail', base, ['TASK-MANAGER-PROOF', managerControlRoomText.en.back], []), viewport },
  ];
}

function buildArabicResponsiveCases() {
  const locale = 'ar', t = staffShellText.ar, collaboration = collaborationText.ar, detail = complaintDetailText.ar, groups = communicationGroupsText.ar, tabs = complaintTabsText.ar, task = taskConversationText.ar;
  return [390, 430, 768, 1024, 1440].flatMap((width) => {
    const base = { locale, role: 'admin', session: 'signed-in' }, viewport = { width };
    return [
      { ...visualCase(`navigation ${width}px`, locale, 'staff-navigation', base, [t.nav.dashboard[0], t.mobileNav.today, t.mobileNav.cases, t.mobileNav.notifications, t.mobileNav.more], []), viewport },
      { ...visualCase(`complaint tabs ${width}px`, locale, 'staff-complaint-detail', { ...base, tab: 'work' }, [detail.title, tabs.work, tabs.communication, tabs.details, tabs.deadlineState], []), viewport },
      { ...visualCase(`internal composer ${width}px`, locale, 'staff-complaint-detail', { ...base, tab: 'communication' }, [collaboration.additions], []), viewport },
      { ...visualCase(`public composer ${width}px`, locale, 'staff-complaint-detail', { ...base, commentVisibility: 'PUBLIC', tab: 'communication' }, [collaboration.publicWarning, collaboration.publicCta], []), viewport },
      { ...visualCase(`task conversation ${width}px`, locale, 'staff-task-detail', base, [task.title, task.responsible, collaboration.additions], []), viewport },
      { ...visualCase(`groups ${width}px`, locale, 'staff-communication-groups', base, [groups.title, groups.personal, groups.deactivate], []), viewport },
      { ...visualCase(`reports ${width}px`, locale, 'staff-reports', base, [reportsDashboardText.ar.title, reportsDashboardText.ar.export.title], []), viewport },
      { ...visualCase(`audit ${width}px`, locale, 'staff-audit', { ...base, admin: 'success' }, [auditViewerText.ar.title, auditViewerText.ar.headers[3]], []), viewport },
      { ...visualCase(`manager control room ${width}px`, locale, 'staff-manager', base, [managerControlRoomText.ar.title, 'TASK-MANAGER-PROOF'], []), viewport },
      { ...visualCase(`task board ${width}px`, locale, 'staff-board', base, [taskBoardText.ar.title, taskBoardText.ar.view.list, 'BOARD-PROOF-001'], []), viewport },
      { ...visualCase(`manager task detail ${width}px`, locale, 'staff-manager-detail', base, ['TASK-MANAGER-PROOF', managerControlRoomText.ar.back], []), viewport },
    ];
  });
}

function visualCase(surface, locale, route, params, signals, classes) {
  return { name: `${locale.toUpperCase()} ${surface} visual regression`, locale, route, params: { ...params, locale }, signals, classes, visual: { minHtml: 1000, minSections: 1 } };
}

function buildPortalVisualCases(locale) {
  const submission = portalSubmissionText[locale], tracking = portalTrackingText[locale], survey = portalSurveyText[locale];
  return [
    portalVisualCase('portal submission mobile', locale, 'portal-submission', { state: locale === 'en' ? 'validation' : 'success', reference: 'CMP-PORTAL-MOBILE' }, [submission.title, locale === 'en' ? submission.states.validation : submission.states.success, locale === 'en' ? submission.fields.attachment : submission.actions.track], locale === 'en' ? ['md:grid-cols-2'] : ['bg-status-success']),
    portalVisualCase('portal tracking mobile', locale, 'portal-tracking-preview', { state: locale === 'en' ? 'requested' : 'attachment', reference: 'CMP-TRACK-MOBILE' }, [tracking.title, locale === 'en' ? tracking.states.requested : tracking.states.attachment, locale === 'en' ? tracking.sections.verify : tracking.sections.attachments], ['lg:grid-cols-[0.9fr_1.1fr]']),
    portalVisualCase('portal survey mobile', locale, 'portal-survey', { state: locale === 'en' ? 'validation' : 'used' }, [survey.title, locale === 'en' ? survey.states.validation : survey.terminal.used.title, locale === 'en' ? survey.fields.rating : survey.actions.trackComplaint], locale === 'en' ? ['grid-cols-5'] : []),
    ...(locale === 'ar' ? [
      portalVisualCase('portal survey expired mobile', locale, 'portal-survey', { state: 'expired' }, [survey.title, survey.terminal.expired.title, survey.terminal.expired.body], []),
      portalVisualCase('portal survey missing mobile', locale, 'portal-survey', { state: 'missing' }, [survey.title, survey.terminal.missing.title, survey.terminal.missing.body], []),
    ] : []),
  ];
}

function portalVisualCase(surface, locale, route, params, signals, classes) {
  return { name: `${locale.toUpperCase()} ${surface} visual regression`, locale, route, params: { ...params, locale }, signals, classes, viewport: { width: 390 }, visual: { minHtml: 1000, minSections: 0 } };
}

function buildAccessibilityCases() {
  const enBase = { locale: 'en', role: 'admin', session: 'signed-in' };
  const arBase = { locale: 'ar', role: 'admin', session: 'signed-in' };
  return [
    accessibilityCase('dashboard status', 'en', { ...enBase }, [modernUiText.en.dashboard.attention, staffShellText.en.dashboard.cards.open[0]], { feedbackRole: false, route: 'staff-dashboard', minAria: 1, minButtons: 0, minFocus: 0, minLabels: 0 }),
    accessibilityCase('dashboard alert', 'ar', { ...arBase }, [modernUiText.ar.dashboard.attention, staffShellText.ar.dashboard.cards.open[0]], { feedbackRole: false, route: 'staff-dashboard', minAria: 1, minButtons: 0, minFocus: 0, minLabels: 0 }),
    accessibilityCase('queue form labels', 'en', { ...enBase }, [staffShellText.en.workQueue.title, staffShellText.en.workQueue.filters.search, staffShellText.en.workQueue.filterHelp], { feedbackRole: false, route: 'staff-complaints', minButtons: 3 }),
    accessibilityCase('queue status', 'ar', { ...arBase }, [staffShellText.ar.workQueue.title, 'CMP-PROOF-001'], { feedbackRole: false, route: 'staff-complaints' }),
    accessibilityCase('create validation', 'en', { ...enBase, create: 'validation', lookup: 'validation' }, [staffShellText.en.createForm.title, staffShellText.en.lookup.states.validation, staffShellText.en.createForm.validation.vinRequired], { route: 'staff-complaint-new' }),
    accessibilityCase('create network alert', 'ar', { ...arBase, create: 'network', lookup: 'down' }, [staffShellText.ar.createForm.title, staffShellText.ar.lookup.states.down], { route: 'staff-complaint-new' }),
    accessibilityCase('detail route', 'en', { ...enBase, lookup: 'disabled', tab: 'details' }, [complaintDetailText.en.title, complaintTabsText.en.details, staffShellText.en.lookup.states.disabled, complaintRelationsText.en.candidates], { feedbackRole: false, route: 'staff-complaint-detail', minLabels: 0 }),
    accessibilityCase('workflow action panel', 'ar', { ...arBase, workflow: 'validation' }, [complaintDetailText.ar.sections.workflow, complaintDetailText.ar.workflow.noExtraFields, `aria-label="${complaintDetailText.ar.sections.workflow}"`], { route: 'staff-complaint-detail', minButtons: 7, minLabels: 0 }),
    accessibilityCase('internal complaint composer', 'ar', { ...arBase, tab: 'communication' }, [complaintTabsText.ar.communication, collaborationText.ar.additions, 'role="tablist"'], { route: 'staff-complaint-detail', minButtons: 4, minLabels: 2 }),
    accessibilityCase('public complaint composer', 'ar', { ...arBase, commentVisibility: 'PUBLIC', tab: 'communication' }, [collaborationText.ar.publicWarning, collaborationText.ar.publicCta], { route: 'staff-complaint-detail', minButtons: 4, minLabels: 2 }),
    accessibilityCase('task conversation', 'ar', { ...arBase }, [taskConversationText.ar.title, taskConversationText.ar.body, collaborationText.ar.additions], { feedbackRole: false, route: 'staff-task-detail', minAria: 1, minButtons: 1, minLabels: 1 }),
    accessibilityCase('task board', 'en', { ...enBase }, [taskBoardText.en.title, taskBoardText.en.boardLabel, taskBoardText.en.columnEmpty, 'BOARD-PROOF-001'], { feedbackRole: false, route: 'staff-board', minAria: 5, minButtons: 2, minLabels: 0 }),
    accessibilityCase('task board', 'ar', { ...arBase }, [taskBoardText.ar.title, taskBoardText.ar.boardLabel, 'BOARD-PROOF-001'], { feedbackRole: false, route: 'staff-board', minAria: 5, minButtons: 2, minLabels: 0 }),
    accessibilityCase('ticket board', 'en', { ...enBase }, [complaintBoardText.en.title, complaintBoardText.en.boardLabel, 'CMP-BOARD-001'], { feedbackRole: false, route: 'staff-complaint-board', minAria: 5, minButtons: 2, minLabels: 0 }),
    accessibilityCase('ticket board', 'ar', { ...arBase }, [complaintBoardText.ar.title, complaintBoardText.ar.boardLabel, 'CMP-BOARD-001'], { feedbackRole: false, route: 'staff-complaint-board', minAria: 5, minButtons: 2, minLabels: 0 }),
    accessibilityCase('communication groups', 'ar', { ...arBase }, [communicationGroupsText.ar.title, communicationGroupsText.ar.personal, communicationGroupsText.ar.deactivate], { route: 'staff-communication-groups', minAria: 1, minButtons: 3, minFocus: 0, minLabels: 0 }),
    accessibilityCase('mobile navigation', 'ar', { ...arBase }, [staffShellText.ar.mobileNav.today, staffShellText.ar.mobileNav.more], { route: 'staff-navigation', feedbackRole: false, minAria: 2, minButtons: 1, minFocus: 5, minLabels: 0 }),
    accessibilityCase('admin hub navigation', 'en', { ...enBase }, [adminHubText.en.title, adminHubText.en.workspaces.users[0], adminHubText.en.workspaces.roles[0], adminHubText.en.open], { route: 'staff-admin', feedbackRole: false, minButtons: 0, minLabels: 0 }),
    accessibilityCase('reports route', 'ar', { ...arBase }, [reportsDashboardText.ar.title, 'CMP-PROOF-RPT-001'], { feedbackRole: false, route: 'staff-reports', minLabels: 0 }),
    accessibilityCase('audit status', 'en', { ...enBase, admin: 'success' }, [auditViewerText.en.title, auditViewerText.en.filters.correlationId], { route: 'staff-audit', minAria: 1 }),
    routeAccessibilityCase('portal submission validation', 'portal-submission', 'en', { locale: 'en', state: 'validation' }, [portalSubmissionText.en.title, portalSubmissionText.en.states.validation, portalSubmissionText.en.states.options], { minLabels: 7, minAria: 5 }),
    routeAccessibilityCase('portal submission success', 'portal-submission', 'ar', { locale: 'ar', state: 'success' }, [portalSubmissionText.ar.title, portalSubmissionText.ar.states.success, portalSubmissionText.ar.next.title], { minLabels: 1, minAria: 3 }),
    routeAccessibilityCase('portal tracking requested', 'portal-tracking-preview', 'en', { locale: 'en', state: 'requested' }, [portalTrackingText.en.title, portalTrackingText.en.states.requested], { minLabels: 3, minAria: 3 }),
    routeAccessibilityCase('portal tracking attachment follow-up', 'portal-tracking-preview', 'ar', { locale: 'ar', state: 'attachment' }, [portalTrackingText.ar.title, portalTrackingText.ar.states.attachment, portalTrackingText.ar.fields.attachment], { minLabels: 5, minAria: 5 }),
    routeAccessibilityCase('portal survey validation', 'portal-survey', 'en', { locale: 'en', state: 'validation' }, [portalSurveyText.en.title, portalSurveyText.en.states.validation], { minLabels: 6, minAria: 5 }),
    routeAccessibilityCase('portal survey used', 'portal-survey', 'ar', { locale: 'ar', state: 'used' }, [portalSurveyText.ar.title, portalSurveyText.ar.terminal.used.title], { minLabels: 0, minAria: 1 }),
  ];
}

function accessibilityCase(surface, locale, params, signals, a11y = {}) {
  const { route, ...rest } = a11y;
  return { name: `${locale.toUpperCase()} ${surface} accessibility`, locale, route, params, signals, a11y: rest };
}

function routeAccessibilityCase(surface, route, locale, params, signals, a11y = {}) {
  return { ...accessibilityCase(surface, locale, params, signals, a11y), route };
}

function buildPerformanceCases() {
  return [
    performanceCase('staff dashboard', 'en', { locale: 'en', role: 'staff', session: 'signed-in' }, [modernUiText.en.dashboard.attention, staffShellText.en.dashboard.cards.open[0], modernUiText.en.dashboard.recentUpdates], { maxMs: 750, maxHtml: 90000, maxRows: 16, minResponsiveGuards: 4 }),
    performanceCase('staff work queue', 'ar', { locale: 'ar', role: 'staff', session: 'signed-in' }, [staffShellText.ar.workQueue.title, staffShellText.ar.workQueue.filters.search, staffShellText.ar.workQueue.pagination.page], { maxMs: 750, maxHtml: 90000, maxRows: 16, minResponsiveGuards: 4 }),
    performanceCase('complaint communication', 'ar', { locale: 'ar', role: 'staff', session: 'signed-in', tab: 'communication' }, [complaintTabsText.ar.communication, collaborationText.ar.additions], { maxMs: 750, maxHtml: 80000, maxRows: 10, minResponsiveGuards: 0 }, 'staff-complaint-detail'),
    performanceCase('task conversation', 'ar', { locale: 'ar', role: 'staff', session: 'signed-in' }, [taskConversationText.ar.title, collaborationText.ar.additions], { maxMs: 750, maxHtml: 50000, maxRows: 0, minResponsiveGuards: 0 }, 'staff-task-detail'),
    performanceCase('communication groups', 'ar', { locale: 'ar', role: 'staff', session: 'signed-in' }, [communicationGroupsText.ar.title, communicationGroupsText.ar.personal], { maxMs: 750, maxHtml: 40000, maxRows: 0, minResponsiveGuards: 0 }, 'staff-communication-groups'),
  ];
}

function performanceCase(surface, locale, params, signals, perf, route) {
  return { name: `${locale.toUpperCase()} ${surface} performance`, locale, params, signals, perf, ...(route ? { route } : {}) };
}

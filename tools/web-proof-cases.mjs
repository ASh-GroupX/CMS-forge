import { adminBranchesText } from '../apps/web/src/i18n/staff-admin-branches.ts';
import { adminUsersText } from '../apps/web/src/i18n/staff-admin-users.ts';
import { adminCategoriesSlaText } from '../apps/web/src/i18n/staff-admin-categories-sla.ts';
import { adminNotificationTemplatesText } from '../apps/web/src/i18n/staff-admin-notification-templates.ts';
import { auditViewerText } from '../apps/web/src/i18n/staff-audit-viewer.ts';
import { complaintDetailText } from '../apps/web/src/i18n/staff-complaint-detail.ts';
import { portalSubmissionText } from '../apps/web/src/i18n/portal-submission.ts';
import { portalSurveyText } from '../apps/web/src/i18n/portal-survey.ts';
import { portalTrackingText } from '../apps/web/src/i18n/portal-tracking.ts';
import { reportsDashboardText } from '../apps/web/src/i18n/staff-reports-dashboard.ts';
import { staffShellText } from '../apps/web/src/i18n/staff-shell.ts';

export const smokeCases = [
  { name: 'English admin shell', locale: 'en', params: { locale: 'en', role: 'admin', session: 'signed-in', admin: 'success', dashboard: 'loading', notification: 'success', reports: 'ready' } },
  { name: 'Arabic management shell', locale: 'ar', params: { locale: 'ar', role: 'management', session: 'signed-in', comments: 'error', queue: 'empty', reports: 'denied' } },
];

export const visualCases = ['en', 'ar'].flatMap((locale) => [...buildVisualCases(locale), ...buildPortalVisualCases(locale)]);
export const accessibilityCases = buildAccessibilityCases();
export const performanceCases = buildPerformanceCases();

export function defaultVisualSignals(locale) {
  const t = staffShellText[locale], reports = reportsDashboardText[locale];
  return [t.title, t.nav.dashboard[0], t.nav.queue[0], t.nav.notifications[0], reports.title, reports.export.title];
}

function buildVisualCases(locale) {
  const t = staffShellText[locale], detail = complaintDetailText[locale];
  const base = { locale, role: 'admin', session: 'signed-in' };
  return [
    visualCase('dashboard', locale, 'staff-dashboard', { ...base }, [t.dashboard.title, t.dashboard.cards.open[0], t.dashboard.cards.averageTat[0]], ['md:grid-cols-3', 'xl:grid-cols-5']),
    visualCase('work queue', locale, 'staff-complaints', { ...base }, [t.workQueue.title, 'CMP-PROOF-001', t.workQueue.pagination.page], ['md:grid-cols-5', 'overflow-x-auto']),
    visualCase('complaint create', locale, 'staff-complaint-new', { ...base, create: 'validation' }, [t.createForm.title, t.createForm.fields.category, t.createForm.validation.vinRequired], ['md:grid-cols-2', 'md:col-span-2']),
    visualCase('complaint detail', locale, 'staff-complaint-detail', { ...base, attachment: 'clean' }, [detail.title, detail.sections.customer, detail.sections.timeline, detail.sections.attachments], ['xl:grid-cols-[1.1fr_0.9fr]', 'md:grid-cols-2']),
    visualCase('workflow modal', locale, 'staff-complaint-detail', { ...base, workflow: 'validation' }, [detail.sections.workflow, detail.workflow.actions[0], detail.workflow.validation], ['role="dialog"', 'xl:col-span-2']),
    visualCase('admin surfaces', locale, 'staff-admin', { ...base, admin: 'validation' }, [adminBranchesText[locale].title, adminUsersText[locale].title, adminCategoriesSlaText[locale].title, adminNotificationTemplatesText[locale].title], []),
    visualCase('reports', locale, 'staff-reports', { ...base }, [reportsDashboardText[locale].title, reportsDashboardText[locale].export.title, 'CMP-PROOF-RPT-001'], ['min-w-[56rem]', 'md:grid-cols-3']),
    visualCase('audit viewer', locale, 'staff-audit', { ...base, admin: 'success' }, [auditViewerText[locale].title, auditViewerText[locale].filters.correlationId, auditViewerText[locale].filters.export], ['xl:grid-cols-5']),
  ];
}

function visualCase(surface, locale, route, params, signals, classes) {
  return { name: `${locale.toUpperCase()} ${surface} visual regression`, locale, route, params: { ...params, locale }, signals, classes, visual: { minHtml: 1000, minSections: 1 } };
}

function buildPortalVisualCases(locale) {
  const submission = portalSubmissionText[locale], tracking = portalTrackingText[locale], survey = portalSurveyText[locale];
  return [
    portalVisualCase('portal submission mobile', locale, 'portal-submission', { state: locale === 'en' ? 'validation' : 'success', reference: 'CMP-PORTAL-MOBILE' }, [submission.title, locale === 'en' ? submission.states.validation : submission.states.success, submission.fields.attachment], ['md:grid-cols-2']),
    portalVisualCase('portal tracking mobile', locale, 'portal-tracking', { state: locale === 'en' ? 'requested' : 'followup', reference: 'CMP-TRACK-MOBILE' }, [tracking.title, locale === 'en' ? tracking.states.requested : tracking.states.followup, tracking.sections.verify], ['lg:grid-cols-[0.9fr_1.1fr]']),
    portalVisualCase('portal survey mobile', locale, 'portal-survey', { state: locale === 'en' ? 'validation' : 'used' }, [survey.title, locale === 'en' ? survey.states.validation : survey.states.used, locale === 'en' ? survey.fields.rating : survey.subtitle], locale === 'en' ? ['grid-cols-5'] : []),
  ];
}

function portalVisualCase(surface, locale, route, params, signals, classes) {
  return { name: `${locale.toUpperCase()} ${surface} visual regression`, locale, route, params: { ...params, locale }, signals, classes, viewport: { width: 390 }, visual: { minHtml: 1000, minSections: 0 } };
}

function buildAccessibilityCases() {
  const enBase = { locale: 'en', role: 'admin', session: 'signed-in' };
  const arBase = { locale: 'ar', role: 'admin', session: 'signed-in' };
  return [
    accessibilityCase('dashboard status', 'en', { ...enBase }, [staffShellText.en.dashboard.title, staffShellText.en.dashboard.cards.open[0]], { feedbackRole: false, route: 'staff-dashboard', minAria: 1, minButtons: 0, minFocus: 0, minLabels: 0 }),
    accessibilityCase('dashboard alert', 'ar', { ...arBase }, [staffShellText.ar.dashboard.title, staffShellText.ar.dashboard.cards.open[0]], { feedbackRole: false, route: 'staff-dashboard', minAria: 1, minButtons: 0, minFocus: 0, minLabels: 0 }),
    accessibilityCase('queue form labels', 'en', { ...enBase }, [staffShellText.en.workQueue.title, staffShellText.en.workQueue.filters.search], { feedbackRole: false, route: 'staff-complaints', minButtons: 3 }),
    accessibilityCase('queue status', 'ar', { ...arBase }, [staffShellText.ar.workQueue.title, 'CMP-PROOF-001'], { feedbackRole: false, route: 'staff-complaints' }),
    accessibilityCase('create validation', 'en', { ...enBase, create: 'validation' }, [staffShellText.en.createForm.title, staffShellText.en.createForm.validation.vinRequired], { route: 'staff-complaint-new' }),
    accessibilityCase('create network alert', 'ar', { ...arBase, create: 'network' }, [staffShellText.ar.createForm.title], { route: 'staff-complaint-new' }),
    accessibilityCase('detail route', 'en', { ...enBase }, [complaintDetailText.en.title, 'CMP-PROOF-DETAIL'], { feedbackRole: false, route: 'staff-complaint-detail', minLabels: 0 }),
    accessibilityCase('workflow dialog', 'ar', { ...arBase, workflow: 'validation' }, [complaintDetailText.ar.sections.workflow, complaintDetailText.ar.workflow.comment], { route: 'staff-complaint-detail', dialog: complaintDetailText.ar.sections.workflow, minButtons: 8, minLabels: 0 }),
    accessibilityCase('admin feedback', 'en', { ...enBase, admin: 'validation' }, [adminUsersText.en.title, adminUsersText.en.states.validation], { route: 'staff-admin', minButtons: 8, minLabels: 0 }),
    accessibilityCase('reports route', 'ar', { ...arBase }, [reportsDashboardText.ar.title, 'CMP-PROOF-RPT-001'], { feedbackRole: false, route: 'staff-reports', minLabels: 0 }),
    accessibilityCase('audit status', 'en', { ...enBase, admin: 'success' }, [auditViewerText.en.title, auditViewerText.en.filters.correlationId], { route: 'staff-audit', minAria: 1 }),
    routeAccessibilityCase('portal submission validation', 'portal-submission', 'en', { locale: 'en', state: 'validation' }, [portalSubmissionText.en.title, portalSubmissionText.en.states.validation], { minLabels: 10, minAria: 5 }),
    routeAccessibilityCase('portal submission success', 'portal-submission', 'ar', { locale: 'ar', state: 'success' }, [portalSubmissionText.ar.title, portalSubmissionText.ar.states.success], { minLabels: 10, minAria: 5 }),
    routeAccessibilityCase('portal tracking requested', 'portal-tracking', 'en', { locale: 'en', state: 'requested' }, [portalTrackingText.en.title, portalTrackingText.en.states.requested], { minLabels: 3, minAria: 3 }),
    routeAccessibilityCase('portal tracking follow-up', 'portal-tracking', 'ar', { locale: 'ar', state: 'followup' }, [portalTrackingText.ar.title, portalTrackingText.ar.states.followup], { minLabels: 4, minAria: 5 }),
    routeAccessibilityCase('portal survey validation', 'portal-survey', 'en', { locale: 'en', state: 'validation' }, [portalSurveyText.en.title, portalSurveyText.en.states.validation], { minLabels: 6, minAria: 5 }),
    routeAccessibilityCase('portal survey used', 'portal-survey', 'ar', { locale: 'ar', state: 'used' }, [portalSurveyText.ar.title, portalSurveyText.ar.states.used], { minLabels: 0, minAria: 1 }),
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
    performanceCase('staff dashboard', 'en', { locale: 'en', role: 'staff', session: 'signed-in' }, [staffShellText.en.dashboard.title, staffShellText.en.dashboard.cards.open[0], staffShellText.en.dashboard.cards.warnings[0]], { maxMs: 750, maxHtml: 90000, maxRows: 16, minResponsiveGuards: 4 }),
    performanceCase('staff work queue', 'ar', { locale: 'ar', role: 'staff', session: 'signed-in' }, [staffShellText.ar.workQueue.title, staffShellText.ar.workQueue.filters.search, staffShellText.ar.workQueue.pagination.page], { maxMs: 750, maxHtml: 90000, maxRows: 16, minResponsiveGuards: 4 }),
  ];
}

function performanceCase(surface, locale, params, signals, perf) {
  return { name: `${locale.toUpperCase()} ${surface} performance`, locale, params, signals, perf };
}

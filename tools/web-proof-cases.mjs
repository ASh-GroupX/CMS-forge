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

export const visualCases = ['en', 'ar'].flatMap((locale) => buildVisualCases(locale));
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
    visualCase('dashboard', locale, { ...base }, [t.dashboard.title, t.dashboard.cards.open[0], t.dashboard.cards.averageTat[0]], ['md:grid-cols-3', 'xl:grid-cols-5']),
    visualCase('work queue', locale, { ...base, queue: 'empty' }, [t.workQueue.title, t.workQueue.filters.status, t.workQueue.pagination.page], ['md:grid-cols-5', 'overflow-x-auto']),
    visualCase('complaint create', locale, { ...base, create: 'validation' }, [t.createForm.title, t.createForm.fields.category, t.createForm.validation.vinRequired], ['md:grid-cols-2', 'md:col-span-2']),
    visualCase('complaint detail', locale, { ...base, attachment: 'clean' }, [detail.title, detail.sections.customer, detail.sections.timeline, detail.sections.attachments], ['xl:grid-cols-[1.1fr_0.9fr]', 'md:grid-cols-2']),
    visualCase('workflow modal', locale, { ...base, workflow: 'validation' }, [detail.sections.workflow, detail.workflow.actions[0], detail.workflow.validation], ['role="dialog"', 'xl:col-span-2']),
    visualCase('admin surfaces', locale, { ...base, admin: 'validation' }, [adminBranchesText[locale].title, adminUsersText[locale].title, adminCategoriesSlaText[locale].title, adminNotificationTemplatesText[locale].title], ['overflow-x-auto', 'md:grid-cols-3']),
    visualCase('reports', locale, { ...base, reports: 'ready' }, [reportsDashboardText[locale].title, reportsDashboardText[locale].export.title, reportsDashboardText[locale].export.scoped], ['min-w-[56rem]', 'md:grid-cols-3']),
    visualCase('audit viewer', locale, { ...base, admin: 'success' }, [auditViewerText[locale].title, auditViewerText[locale].filters.correlationId, auditViewerText[locale].filters.export], ['xl:grid-cols-5', 'overflow-x-auto']),
  ];
}

function visualCase(surface, locale, params, signals, classes) {
  return { name: `${locale.toUpperCase()} ${surface} visual regression`, locale, params: { ...params, locale }, signals, classes };
}

function buildAccessibilityCases() {
  const enBase = { locale: 'en', role: 'admin', session: 'signed-in' };
  const arBase = { locale: 'ar', role: 'admin', session: 'signed-in' };
  return [
    accessibilityCase('dashboard status', 'en', { ...enBase, dashboard: 'loading' }, [staffShellText.en.dashboard.title, staffShellText.en.dashboard.states.loading]),
    accessibilityCase('dashboard alert', 'ar', { ...arBase, dashboard: 'error' }, [staffShellText.ar.dashboard.title, staffShellText.ar.dashboard.states.error]),
    accessibilityCase('queue form labels', 'en', { ...enBase, queue: 'empty' }, [staffShellText.en.workQueue.title, staffShellText.en.workQueue.filters.search], { minButtons: 3 }),
    accessibilityCase('queue alert', 'ar', { ...arBase, queue: 'error' }, [staffShellText.ar.workQueue.title, staffShellText.ar.workQueue.states.error]),
    accessibilityCase('create validation', 'en', { ...enBase, create: 'validation' }, [staffShellText.en.createForm.title, staffShellText.en.createForm.validation.vinRequired], { minButtons: 5 }),
    accessibilityCase('create network alert', 'ar', { ...arBase, create: 'network' }, [staffShellText.ar.createForm.title]),
    accessibilityCase('detail alert', 'en', { ...enBase, detail: 'error' }, [complaintDetailText.en.title, complaintDetailText.en.states.error]),
    accessibilityCase('workflow dialog', 'ar', { ...arBase, workflow: 'validation' }, [complaintDetailText.ar.sections.workflow, complaintDetailText.ar.workflow.comment], { dialog: complaintDetailText.ar.sections.workflow, minButtons: 8 }),
    accessibilityCase('admin feedback', 'en', { ...enBase, admin: 'validation' }, [adminUsersText.en.title, adminUsersText.en.states.validation], { minButtons: 8 }),
    accessibilityCase('reports denied', 'ar', { ...arBase, reports: 'denied' }, [reportsDashboardText.ar.title, reportsDashboardText.ar.states.denied], { minButtons: 5 }),
    accessibilityCase('audit status', 'en', { ...enBase, admin: 'success' }, [auditViewerText.en.title, auditViewerText.en.filters.correlationId], { minButtons: 8 }),
    routeAccessibilityCase('portal submission validation', 'portal-submission', 'en', { locale: 'en', state: 'validation' }, [portalSubmissionText.en.title, portalSubmissionText.en.states.validation], { minLabels: 10, minAria: 5 }),
    routeAccessibilityCase('portal submission success', 'portal-submission', 'ar', { locale: 'ar', state: 'success' }, [portalSubmissionText.ar.title, portalSubmissionText.ar.states.success], { minLabels: 10, minAria: 5 }),
    routeAccessibilityCase('portal tracking requested', 'portal-tracking', 'en', { locale: 'en', state: 'requested' }, [portalTrackingText.en.title, portalTrackingText.en.states.requested], { minLabels: 3, minAria: 3 }),
    routeAccessibilityCase('portal tracking follow-up', 'portal-tracking', 'ar', { locale: 'ar', state: 'followup' }, [portalTrackingText.ar.title, portalTrackingText.ar.states.followup], { minLabels: 4, minAria: 5 }),
    routeAccessibilityCase('portal survey validation', 'portal-survey', 'en', { locale: 'en', state: 'validation' }, [portalSurveyText.en.title, portalSurveyText.en.states.validation], { minLabels: 6, minAria: 5 }),
    routeAccessibilityCase('portal survey used', 'portal-survey', 'ar', { locale: 'ar', state: 'used' }, [portalSurveyText.ar.title, portalSurveyText.ar.states.used], { minLabels: 0, minAria: 1 }),
  ];
}

function accessibilityCase(surface, locale, params, signals, a11y = {}) {
  return { name: `${locale.toUpperCase()} ${surface} accessibility`, locale, params, signals, a11y };
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

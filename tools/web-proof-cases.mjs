import { adminUsersText } from '../apps/web/src/i18n/staff-admin-users.ts';
import { auditViewerText } from '../apps/web/src/i18n/staff-audit-viewer.ts';
import { complaintDetailText } from '../apps/web/src/i18n/staff-complaint-detail.ts';
import { complaintRelationsText } from '../apps/web/src/i18n/staff-complaint-relations.ts';
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
  const t = staffShellText[locale], detail = complaintDetailText[locale], relations = complaintRelationsText[locale];
  const base = { locale, role: 'admin', session: 'signed-in' };
  return [
    visualCase('dashboard', locale, 'staff-dashboard', { ...base }, [t.dashboard.title, t.dashboard.cards.open[0], t.dashboard.cards.averageTat[0]], ['lg:grid-cols-[1.2fr_2fr]', 'md:grid-cols-2']),
    visualCase('work queue', locale, 'staff-complaints', { ...base }, [t.workQueue.title, 'CMP-PROOF-001', t.workQueue.pagination.page], ['md:grid-cols-6', 'overflow-x-auto']),
    visualCase('complaint create', locale, 'staff-complaint-new', { ...base, create: 'validation', lookup: 'match' }, [t.createForm.title, t.lookup.states.match, t.lookup.actions.useMatch, t.createForm.validation.vinRequired], ['md:grid-cols-2', 'md:col-span-2']),
    visualCase('complaint detail', locale, 'staff-complaint-detail', { ...base, attachment: 'clean', lookup: 'multiple' }, [detail.title, detail.sections.customer, detail.sections.timeline, detail.sections.attachments, detail.correction.title, t.lookup.states.multiple, relations.title], ['xl:grid-cols-[minmax(0,1.35fr)_minmax(22rem,0.65fr)]', 'md:grid-cols-2']),
    visualCase('workflow action panel', locale, 'staff-complaint-detail', { ...base, workflow: 'validation' }, [detail.sections.workflow, detail.workflow.actions[0], detail.workflow.validation], [`aria-label="${detail.sections.workflow}"`, 'border-line-subtle']),
    visualCase('admin surfaces', locale, 'staff-admin', { ...base, admin: 'validation' }, [adminUsersText[locale].masterData.title, adminUsersText[locale].title, adminUsersText[locale].masterData.sections.branches, adminUsersText[locale].masterData.sections.categories], []),
    visualCase('reports', locale, 'staff-reports', { ...base }, [reportsDashboardText[locale].title, reportsDashboardText[locale].export.title, reportsDashboardText[locale].kpis.slaBreachRate, reportsDashboardText[locale].kpis.agingOverSeven, 'CMP-PROOF-RPT-001'], ['min-w-[56rem]', 'md:grid-cols-3']),
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
    portalVisualCase('portal tracking mobile', locale, 'portal-tracking-preview', { state: locale === 'en' ? 'requested' : 'attachment', reference: 'CMP-TRACK-MOBILE' }, [tracking.title, locale === 'en' ? tracking.states.requested : tracking.states.attachment, locale === 'en' ? tracking.sections.verify : tracking.sections.attachments], ['lg:grid-cols-[0.9fr_1.1fr]']),
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
    accessibilityCase('create validation', 'en', { ...enBase, create: 'validation', lookup: 'validation' }, [staffShellText.en.createForm.title, staffShellText.en.lookup.states.validation, staffShellText.en.createForm.validation.vinRequired], { route: 'staff-complaint-new' }),
    accessibilityCase('create network alert', 'ar', { ...arBase, create: 'network', lookup: 'down' }, [staffShellText.ar.createForm.title, staffShellText.ar.lookup.states.down], { route: 'staff-complaint-new' }),
    accessibilityCase('detail route', 'en', { ...enBase, lookup: 'disabled' }, [complaintDetailText.en.title, 'CMP-PROOF-DETAIL', staffShellText.en.lookup.states.disabled, complaintRelationsText.en.candidates], { feedbackRole: false, route: 'staff-complaint-detail', minLabels: 0 }),
    accessibilityCase('workflow action panel', 'ar', { ...arBase, workflow: 'validation' }, [complaintDetailText.ar.sections.workflow, complaintDetailText.ar.workflow.noExtraFields, `aria-label="${complaintDetailText.ar.sections.workflow}"`], { route: 'staff-complaint-detail', minButtons: 8, minLabels: 0 }),
    accessibilityCase('admin feedback', 'en', { ...enBase, admin: 'validation' }, [adminUsersText.en.title, adminUsersText.en.states.validation], { route: 'staff-admin', minButtons: 6, minLabels: 0 }),
    accessibilityCase('reports route', 'ar', { ...arBase }, [reportsDashboardText.ar.title, 'CMP-PROOF-RPT-001'], { feedbackRole: false, route: 'staff-reports', minLabels: 0 }),
    accessibilityCase('audit status', 'en', { ...enBase, admin: 'success' }, [auditViewerText.en.title, auditViewerText.en.filters.correlationId], { route: 'staff-audit', minAria: 1 }),
    routeAccessibilityCase('portal submission validation', 'portal-submission', 'en', { locale: 'en', state: 'validation' }, [portalSubmissionText.en.title, portalSubmissionText.en.states.validation], { minLabels: 10, minAria: 5 }),
    routeAccessibilityCase('portal submission success', 'portal-submission', 'ar', { locale: 'ar', state: 'success' }, [portalSubmissionText.ar.title, portalSubmissionText.ar.states.success], { minLabels: 10, minAria: 5 }),
    routeAccessibilityCase('portal tracking requested', 'portal-tracking-preview', 'en', { locale: 'en', state: 'requested' }, [portalTrackingText.en.title, portalTrackingText.en.states.requested], { minLabels: 3, minAria: 3 }),
    routeAccessibilityCase('portal tracking attachment follow-up', 'portal-tracking-preview', 'ar', { locale: 'ar', state: 'attachment' }, [portalTrackingText.ar.title, portalTrackingText.ar.states.attachment, portalTrackingText.ar.fields.attachment], { minLabels: 5, minAria: 5 }),
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

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import React from 'react';
import { resolveLocale, staffShellText, type Locale } from '../i18n/staff-shell';
import { getStaffDashboardSummary } from '../lib/staff-dashboard-api';
import { getStaffComplaintDetail } from '../lib/staff-detail-api';
import { getStaffReportRows } from '../lib/staff-reports-api';
import { getStaffQueueItems } from '../lib/staff-queue-api';
import { getStaffSessionPrincipal } from '../lib/staff-session-api';
import { AdminSurfaces, type AdminFixtureState } from './admin-surfaces';
import { ComplaintDetailWorkspace, type ComplaintCommentsFixtureState, type ComplaintDetailFixtureState, type ComplaintWorkflowFixtureState } from './complaint-detail-workspace';
import { ComplaintIntakeWorkspace } from './complaint-intake-workspace';
import { DashboardSummary, type DashboardFixtureState } from './dashboard-summary';
import { type LookupFixtureState } from './customer-vehicle-lookup';
import { type CreateFormFixtureState } from './complaint-create-form';
import { AttachmentUploadPanel, type AttachmentFixtureState } from './attachment-upload-panel';
import { NotificationCenter, type NotificationFixtureState } from './notification-center';
import { type ResetFixtureState } from './password-reset-panel';
import { ReportsDashboard, type ReportsFixtureState } from './reports-dashboard';
import { StaffAuthLanding } from './staff-auth-landing';
import { AuthPanel, RolePanel, roleNav, type RolePreview } from './staff-shell-panels';
import { WorkQueue, type QueueFixtureState } from './work-queue';
import { AppShell, type StaffNavKey } from './app-shell';

type SearchParams = {
  admin?: string | string[]; auth?: string | string[]; attachment?: string | string[]; comments?: string | string[]; create?: string | string[];
  dashboard?: string | string[]; detail?: string | string[]; locale?: string | string[]; lookup?: string | string[];
  notification?: string | string[]; complaintId?: string | string[]; preview?: string | string[]; queue?: string | string[];
  reports?: string | string[]; role?: string | string[]; reset?: string | string[]; session?: string | string[]; workflow?: string | string[];
};

export default async function StaffShellPage({
  cookieHeader,
  fetchImpl,
  searchParams,
}: {
  cookieHeader?: string;
  fetchImpl?: typeof fetch;
  searchParams?: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const locale = resolveLocale(params?.locale);
  const apiInput = {
    ...(cookieHeader === undefined ? {} : { cookieHeader }),
    ...(fetchImpl === undefined ? {} : { fetchImpl }),
  };
  const complaintId = readParam(params?.complaintId);
  const principal = await getStaffSessionPrincipal(apiInput);
  if (await isNextRequest()) {
    if (principal) redirect(withLocale(principal.roleCode === 'MGMT_READONLY' ? '/dashboard' : '/tasks/today', locale));
    return <StaffAuthLanding authError={readParam(params?.auth) === 'error'} locale={locale} resetState={resolveReset(readParam(params?.reset))} />;
  }

  const [dashboardSummary, reportRows, queueRows, complaintDetail] = await Promise.all([
    getStaffDashboardSummary(apiInput),
    getStaffReportRows(apiInput),
    getStaffQueueItems(apiInput),
    getStaffComplaintDetail({ ...apiInput, ...(complaintId === undefined ? {} : { complaintId }) }),
  ]);
  return (
    <StaffShell
      adminState={oneOf<AdminFixtureState>(readParam(params?.admin), ['loading', 'empty', 'error', 'success', 'validation', 'conflict'])}
      authError={readParam(params?.auth) === 'error'}
      attachmentState={resolveAttachment(readParam(params?.attachment))}
      commentsState={resolveComments(readParam(params?.comments))}
      createState={resolveCreate(readParam(params?.create))}
      dashboardState={resolveDashboard(readParam(params?.dashboard))}
      dashboardSummary={dashboardSummary ?? undefined}
      detailState={resolveDetail(readParam(params?.detail))}
      complaintDetail={complaintDetail ?? undefined}
      isSignedIn={Boolean(principal) || readParam(params?.session) === 'signed-in'}
      locale={locale}
      lookupState={resolveLookup(readParam(params?.lookup))}
      notificationState={oneOf<NotificationFixtureState>(readParam(params?.notification), ['loading', 'empty', 'error', 'success', 'validation', 'conflict'])}
      queueState={resolveQueue(readParam(params?.queue))}
      queueRows={queueRows ?? undefined}
      reportsState={oneOf<ReportsFixtureState>(readParam(params?.reports), ['ready', 'loading', 'empty', 'error', 'success', 'validation', 'denied', 'conflict'])}
      reportRows={reportRows ?? undefined}
      resetState={resolveReset(readParam(params?.reset))}
      role={principal ? roleFromPrincipal(principal.roleCode) : resolveRole(readParam(params?.role))}
      workflowState={oneOf<ComplaintWorkflowFixtureState>(readParam(params?.workflow), ['loading', 'empty', 'error', 'success', 'conflict', 'validation'])}
    />
  );
}

function readParam(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }

async function isNextRequest(): Promise<boolean> {
  try {
    await headers();
    return true;
  } catch {
    return false;
  }
}

function withLocale(path: string, locale: Locale): string {
  return `${path}?locale=${encodeURIComponent(locale)}`;
}

function resolveRole(value: string | undefined): RolePreview {
  return value === 'admin' || value === 'management' ? value : 'staff';
}

function roleFromPrincipal(roleCode: string): RolePreview {
  if (roleCode === 'ADMIN') return 'admin';
  if (roleCode === 'CR_MANAGER' || roleCode === 'BRANCH_MANAGER' || roleCode === 'MGMT_READONLY') return 'management';
  return 'staff';
}

function resolveReset(value: string | undefined): ResetFixtureState | undefined {
  return oneOf(value, ['request', 'requested', 'token', 'success', 'invalid', 'error']);
}

function resolveDashboard(value: string | undefined): DashboardFixtureState | undefined { return oneOf(value, ['loading', 'empty', 'error']); }
function resolveQueue(value: string | undefined): QueueFixtureState | undefined { return oneOf(value, ['loading', 'empty', 'error', 'success', 'conflict']); }
function resolveDetail(value: string | undefined): ComplaintDetailFixtureState | undefined { return oneOf(value, ['loading', 'empty', 'error', 'denied', 'notFound']); }
function resolveComments(value: string | undefined): ComplaintCommentsFixtureState | undefined { return oneOf(value, ['loading', 'empty', 'error']); }
function resolveLookup(value: string | undefined): LookupFixtureState | undefined { return oneOf(value, ['loading', 'none', 'error', 'match', 'multiple', 'down', 'disabled', 'validation', 'manual']); }

function resolveCreate(value: string | undefined): CreateFormFixtureState | undefined {
  return oneOf(value, ['validation', 'success', 'error', 'loading', 'network']);
}

function resolveAttachment(value: string | undefined): AttachmentFixtureState | undefined {
  return oneOf(value, ['loading', 'empty', 'error', 'pending', 'clean', 'rejected']);
}

function oneOf<T extends string>(value: string | undefined, values: readonly T[]): T | undefined {
  return values.includes(value as T) ? (value as T) : undefined;
}

export function StaffShell({
  adminState,
  authError = false,
  attachmentState,
  commentsState,
  complaintDetail,
  createState,
  dashboardState,
  dashboardSummary,
  detailState,
  isSignedIn = false,
  locale,
  lookupState,
  notificationState,
  queueState,
  queueRows,
  reportsState,
  reportRows,
  resetState,
  role = 'staff',
  workflowState,
}: {
  adminState?: AdminFixtureState | undefined;
  authError?: boolean;
  attachmentState?: AttachmentFixtureState | undefined;
  commentsState?: ComplaintCommentsFixtureState | undefined;
  complaintDetail?: import('../lib/staff-detail-api').StaffComplaintDetailView | undefined;
  createState?: CreateFormFixtureState | undefined;
  dashboardState?: DashboardFixtureState | undefined;
  dashboardSummary?: import('../lib/staff-dashboard-api').StaffDashboardSummary | undefined;
  detailState?: ComplaintDetailFixtureState | undefined;
  isSignedIn?: boolean;
  locale: Locale;
  lookupState?: LookupFixtureState | undefined;
  notificationState?: NotificationFixtureState | undefined;
  queueState?: QueueFixtureState | undefined;
  queueRows?: import('../lib/staff-complaints-api').ComplaintQueueItem[] | undefined;
  reportsState?: ReportsFixtureState | undefined;
  reportRows?: import('../lib/staff-reports-api').StaffReportRow[] | undefined;
  resetState?: ResetFixtureState | undefined;
  role?: RolePreview;
  workflowState?: ComplaintWorkflowFixtureState | undefined;
}) {
  const t = staffShellText[locale];
  const visibleNav = roleNav[role] as readonly StaffNavKey[];

  return (
    <AppShell
      locale={locale}
      navKeys={visibleNav}
      signedIn={isSignedIn}
      sidebarAfter={visibleNav.includes('admin') ? null : <p className="mt-3 rounded-sm bg-brand-foreground/5 px-2 py-2 text-xs font-semibold text-brand-foreground/65">{t.role.adminHidden}</p>}
      sidebarBefore={<><AuthPanel authError={authError} isSignedIn={isSignedIn} locale={locale} resetState={resetState} /><RolePanel locale={locale} role={role} /></>}
    >
      <DashboardSummary locale={locale} role={role} state={dashboardState} summary={dashboardSummary ?? undefined} />
      <NotificationCenter locale={locale} state={notificationState} />
      <WorkQueue locale={locale} rows={queueRows} state={queueState} />
      {role === 'staff' ? null : <ReportsDashboard canExport locale={locale} rows={reportRows} state={reportsState} />}
      <ComplaintDetailWorkspace attachmentState={attachmentState} commentsState={commentsState} detail={complaintDetail} locale={locale} lookupState={lookupState} state={detailState} workflowState={workflowState} />
      {role === 'admin' ? <AdminSurfaces locale={locale} state={adminState} /> : null}
      <ComplaintIntakeWorkspace createState={createState} locale={locale} lookupState={lookupState} />
      <AttachmentUploadPanel locale={locale} state={attachmentState} />
    </AppShell>
  );
}

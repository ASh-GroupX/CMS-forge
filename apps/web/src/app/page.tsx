import {
  Bell,
  ClipboardList,
  FilePlus2,
  FolderCog,
  Gauge,
  History,
  Inbox,
  Search,
} from 'lucide-react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import React from 'react';
import { resolveLocale, staffShellText, type Locale } from '../i18n/staff-shell';
import { getStaffDashboardSummary } from '../lib/staff-dashboard-api';
import { getStaffComplaintDetail } from '../lib/staff-detail-api';
import { getStaffReportRows } from '../lib/staff-reports-api';
import { getStaffQueueItems } from '../lib/staff-queue-api';
import { getStaffSessionPrincipal } from '../lib/staff-session-api';
import { AdminSurfaces, type AdminPreviewState } from './admin-surfaces';
import { ComplaintDetailWorkspace, type ComplaintCommentsPreviewState, type ComplaintDetailPreviewState, type ComplaintWorkflowPreviewState } from './complaint-detail-workspace';
import { DashboardSummary, type DashboardPreviewState } from './dashboard-summary';
import { CustomerVehicleLookup, type LookupPreviewState } from './customer-vehicle-lookup';
import { ComplaintCreateForm, type CreateFormPreviewState } from './complaint-create-form';
import { AttachmentUploadPanel, type AttachmentPreviewState } from './attachment-upload-panel';
import { NotificationCenter, type NotificationPreviewState } from './notification-center';
import { type ResetPreviewState } from './password-reset-panel';
import { ReportsDashboard, type ReportsPreviewState } from './reports-dashboard';
import { StaffAuthLanding } from './staff-auth-landing';
import { AuthPanel, RolePanel, roleNav, type RolePreview } from './staff-shell-panels';
import { StaffTopBar } from './staff-top-bar';
import { WorkQueue, type QueuePreviewState } from './work-queue';

const navKeys = ['dashboard', 'queue', 'create', 'detail', 'admin', 'reports', 'audit', 'notifications'] as const;
type NavKey = (typeof navKeys)[number];

const icons = {
  dashboard: Gauge,
  queue: Inbox,
  create: FilePlus2,
  detail: Search,
  admin: FolderCog,
  reports: ClipboardList,
  audit: History,
  notifications: Bell,
} as const;

type SearchParams = {
  admin?: string | string[]; auth?: string | string[]; attachment?: string | string[]; comments?: string | string[]; create?: string | string[];
  dashboard?: string | string[]; detail?: string | string[]; locale?: string | string[]; lookup?: string | string[]; notification?: string | string[];
  complaintId?: string | string[]; preview?: string | string[]; queue?: string | string[]; reports?: string | string[]; role?: string | string[]; reset?: string | string[]; session?: string | string[]; workflow?: string | string[];
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
  if (await isNextRequest() && !hasPreviewParam(params)) {
    if (principal) redirect(withLocale('/dashboard', locale));
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
      adminState={oneOf<AdminPreviewState>(readParam(params?.admin), ['loading', 'empty', 'error', 'success', 'validation', 'conflict'])}
      authError={readParam(params?.auth) === 'error'}
      attachmentState={resolveAttachment(readParam(params?.attachment))}
      commentsState={resolveDetail(readParam(params?.comments))}
      createState={resolveCreate(readParam(params?.create))}
      dashboardState={resolveDashboard(readParam(params?.dashboard))}
      dashboardSummary={dashboardSummary ?? undefined}
      detailState={resolveDetail(readParam(params?.detail))}
      complaintDetail={complaintDetail ?? undefined}
      isSignedIn={Boolean(principal) || readParam(params?.session) === 'signed-in'}
      locale={locale}
      lookupState={resolveLookup(readParam(params?.lookup))}
      notificationState={oneOf<NotificationPreviewState>(readParam(params?.notification), ['loading', 'empty', 'error', 'success', 'validation', 'conflict'])}
      queueState={resolveQueue(readParam(params?.queue))}
      queueRows={queueRows ?? undefined}
      reportsState={oneOf<ReportsPreviewState>(readParam(params?.reports), ['ready', 'loading', 'empty', 'error', 'success', 'validation', 'denied', 'conflict'])}
      reportRows={reportRows ?? undefined}
      resetState={resolveReset(readParam(params?.reset))}
      role={principal ? roleFromPrincipal(principal.roleCode) : resolveRole(readParam(params?.role))}
      workflowState={oneOf<ComplaintWorkflowPreviewState>(readParam(params?.workflow), ['loading', 'empty', 'error', 'success', 'conflict', 'validation'])}
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

function hasPreviewParam(params: SearchParams | undefined): boolean {
  if (!params) return false;
  return Object.entries(params).some(([key, value]) => key !== 'locale' && value !== undefined);
}

function withLocale(path: string, locale: Locale): string {
  return `${path}?locale=${encodeURIComponent(locale)}`;
}

function navHref(key: NavKey, locale: Locale): string {
  const routes: Record<NavKey, string> = {
    dashboard: '/dashboard',
    queue: '/complaints',
    create: '/complaints/new',
    detail: '/complaints',
    admin: '/admin',
    reports: '/reports',
    audit: '/audit',
    notifications: '/notifications',
  };
  return withLocale(routes[key], locale);
}

function resolveRole(value: string | undefined): RolePreview {
  return value === 'admin' || value === 'management' ? value : 'staff';
}

function roleFromPrincipal(roleCode: string): RolePreview {
  if (roleCode === 'ADMIN') return 'admin';
  if (roleCode === 'CR_MANAGER' || roleCode === 'BRANCH_MANAGER' || roleCode === 'MGMT_READONLY') return 'management';
  return 'staff';
}

function resolveReset(value: string | undefined): ResetPreviewState | undefined {
  return oneOf(value, ['request', 'requested', 'token', 'success', 'invalid']);
}

function resolveDashboard(value: string | undefined): DashboardPreviewState | undefined { return oneOf(value, ['loading', 'empty', 'error']); }
function resolveQueue(value: string | undefined): QueuePreviewState | undefined { return oneOf(value, ['loading', 'empty', 'error', 'success', 'conflict']); }
function resolveDetail(value: string | undefined): ComplaintDetailPreviewState | undefined { return oneOf(value, ['loading', 'empty', 'error']); }
function resolveLookup(value: string | undefined): LookupPreviewState | undefined { return oneOf(value, ['loading', 'none', 'error']); }

function resolveCreate(value: string | undefined): CreateFormPreviewState | undefined {
  return oneOf(value, ['validation', 'success', 'error', 'loading', 'network']);
}

function resolveAttachment(value: string | undefined): AttachmentPreviewState | undefined {
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
  adminState?: AdminPreviewState | undefined;
  authError?: boolean;
  attachmentState?: AttachmentPreviewState | undefined;
  commentsState?: ComplaintCommentsPreviewState | undefined;
  complaintDetail?: import('../lib/staff-detail-api').StaffComplaintDetailView | undefined;
  createState?: CreateFormPreviewState | undefined;
  dashboardState?: DashboardPreviewState | undefined;
  dashboardSummary?: import('../lib/staff-dashboard-api').StaffDashboardSummary | undefined;
  detailState?: ComplaintDetailPreviewState | undefined;
  isSignedIn?: boolean;
  locale: Locale;
  lookupState?: LookupPreviewState | undefined;
  notificationState?: NotificationPreviewState | undefined;
  queueState?: QueuePreviewState | undefined;
  queueRows?: import('../lib/staff-complaints-api').ComplaintQueueItem[] | undefined;
  reportsState?: ReportsPreviewState | undefined;
  reportRows?: import('../lib/staff-reports-api').StaffReportRow[] | undefined;
  resetState?: ResetPreviewState | undefined;
  role?: RolePreview;
  workflowState?: ComplaintWorkflowPreviewState | undefined;
}) {
  const t = staffShellText[locale];
  const visibleNav = roleNav[role] as readonly NavKey[];

  return (
    <main lang={t.lang} dir={t.dir} className="min-h-screen bg-background text-foreground">
      <StaffTopBar
        languageHref={`?locale=${locale === 'ar' ? 'en' : 'ar'}`}
        signedIn={isSignedIn ? t.auth.signedIn : t.auth.signedOut}
        subtitle={t.subtitle}
        switchLabel={t.switchLabel}
        switchTarget={t.switchTarget}
        themeDark={t.theme.dark}
        themeLabel={t.theme.label}
        themeLight={t.theme.light}
        title={t.title}
      />
      <div className="grid min-h-[calc(100vh-4.5rem)] grid-cols-1 gap-4 p-4 md:p-6 lg:grid-cols-[18rem_1fr]">
        <aside className="rounded-md border border-border bg-card p-3 shadow-sm lg:sticky lg:top-20 lg:self-start">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">{t.subtitle}</p>
              <h1 className="text-2xl font-semibold tracking-normal">{t.title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{t.branch}</p>
              <p className="mt-2 inline-flex rounded-sm bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">
                {isSignedIn ? t.auth.signedIn : t.auth.signedOut}
              </p>
            </div>
          </div>
          <AuthPanel authError={authError} isSignedIn={isSignedIn} locale={locale} resetState={resetState} />
          <RolePanel locale={locale} role={role} />
          <nav className="grid gap-1" aria-label={t.title}>
            {visibleNav.map((key) => {
              const Icon = icons[key];
              const [label, description] = t.nav[key];
              return (
                <a
                  key={key}
                  href={navHref(key, locale)}
                  className="grid grid-cols-[2rem_1fr] gap-2 rounded-sm px-2 py-2 text-start hover:bg-accent focus:outline-none focus:ring-2 focus:ring-brand"
                >
                  <Icon className="mt-1 size-4 text-brand" aria-hidden="true" />
                  <span>
                    <span className="block text-sm font-semibold">{label}</span>
                    <span className="block text-xs text-muted-foreground">{description}</span>
                  </span>
                </a>
              );
            })}
          </nav>
          {visibleNav.includes('admin') ? null : (
            <p className="mt-3 rounded-sm bg-muted px-2 py-2 text-xs font-semibold text-muted-foreground">
              {t.role.adminHidden}
            </p>
          )}
        </aside>

        <section className="grid content-start gap-4">
          <DashboardSummary locale={locale} role={role} state={dashboardState} summary={dashboardSummary ?? undefined} />
          <NotificationCenter locale={locale} state={notificationState} />
          <WorkQueue locale={locale} rows={queueRows} state={queueState} />
          {role === 'staff' ? null : <ReportsDashboard locale={locale} rows={reportRows} state={reportsState} />}
          <ComplaintDetailWorkspace attachmentState={attachmentState} commentsState={commentsState} detail={complaintDetail} locale={locale} state={detailState} workflowState={workflowState} />
          {role === 'admin' ? <AdminSurfaces locale={locale} state={adminState} /> : null}
          <CustomerVehicleLookup locale={locale} state={lookupState} />
          <ComplaintCreateForm locale={locale} state={createState} />
          <AttachmentUploadPanel locale={locale} state={attachmentState} />
        </section>
      </div>
    </main>
  );
}

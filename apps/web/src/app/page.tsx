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
import React from 'react';
import { resolveLocale, staffShellText, type Locale } from '../i18n/staff-shell';

const navKeys = ['dashboard', 'queue', 'create', 'detail', 'admin', 'reports', 'audit', 'notifications'] as const;
type NavKey = (typeof navKeys)[number];
type RolePreview = 'staff' | 'admin' | 'management';

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
  auth?: string | string[];
  locale?: string | string[];
  role?: string | string[];
  session?: string | string[];
};

export default async function StaffShellPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const params = await searchParams;
  const locale = resolveLocale(params?.locale);
  return (
    <StaffShell
      authError={readParam(params?.auth) === 'error'}
      isSignedIn={readParam(params?.session) === 'signed-in'}
      locale={locale}
      role={resolveRole(readParam(params?.role))}
    />
  );
}

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function resolveRole(value: string | undefined): RolePreview {
  return value === 'admin' || value === 'management' ? value : 'staff';
}

const roleNav: Record<RolePreview, readonly NavKey[]> = {
  staff: ['dashboard', 'queue', 'create', 'detail', 'notifications'],
  admin: navKeys,
  management: ['dashboard', 'queue', 'detail', 'reports', 'audit', 'notifications'],
};

export function StaffShell({
  authError = false,
  isSignedIn = false,
  locale,
  role = 'staff',
}: {
  authError?: boolean;
  isSignedIn?: boolean;
  locale: Locale;
  role?: RolePreview;
}) {
  const t = staffShellText[locale];
  const switchLocale = locale === 'ar' ? 'en' : 'ar';
  const visibleNav = roleNav[role];

  return (
    <main lang={t.lang} dir={t.dir} className="min-h-screen bg-neutral p-4 text-neutral-foreground md:p-6">
      <div className="grid min-h-[calc(100vh-2rem)] grid-cols-1 gap-4 md:min-h-[calc(100vh-3rem)] lg:grid-cols-[18rem_1fr]">
        <aside className="rounded-md border border-slate-200 bg-white p-3 shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">{t.subtitle}</p>
              <h1 className="text-2xl font-semibold tracking-normal">{t.title}</h1>
              <p className="mt-1 text-sm text-slate-600">{t.branch}</p>
              <p className="mt-2 inline-flex rounded-sm bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                {isSignedIn ? t.auth.signedIn : t.auth.signedOut}
              </p>
            </div>
            <a
              className="rounded-sm border border-slate-300 px-2 py-1 text-sm font-medium hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand"
              href={`/?locale=${switchLocale}`}
              aria-label={t.switchLabel}
            >
              {t.switchTarget}
            </a>
          </div>
          <AuthPanel authError={authError} isSignedIn={isSignedIn} locale={locale} />
          <RolePanel locale={locale} role={role} />
          <nav className="grid gap-1" aria-label={t.title}>
            {visibleNav.map((key) => {
              const Icon = icons[key];
              const [label, description] = t.nav[key];
              return (
                <a
                  key={key}
                  href="#"
                  className="grid grid-cols-[2rem_1fr] gap-2 rounded-sm px-2 py-2 text-start hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-brand"
                >
                  <Icon className="mt-1 size-4 text-brand" aria-hidden="true" />
                  <span>
                    <span className="block text-sm font-semibold">{label}</span>
                    <span className="block text-xs text-slate-600">{description}</span>
                  </span>
                </a>
              );
            })}
          </nav>
          {visibleNav.includes('admin') ? null : (
            <p className="mt-3 rounded-sm bg-slate-100 px-2 py-2 text-xs font-semibold text-slate-600">
              {t.role.adminHidden}
            </p>
          )}
        </aside>

        <section className="grid content-start gap-4">
          <div className="grid gap-3 md:grid-cols-4">
            {[
              [t.open, '18'],
              [t.warnings, '6'],
              [t.overdue, '2'],
              [t.nextAction, '9'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm text-slate-600">{label}</p>
                <p className="mt-2 text-3xl font-semibold tracking-normal">{value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-md border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-4">
              <h2 className="text-lg font-semibold tracking-normal">{t.queueTitle}</h2>
              <p className="mt-1 text-sm text-slate-600">{t.queueStatus}</p>
            </div>
            <div className="grid grid-cols-[1fr_auto_auto] gap-3 p-4 text-sm font-semibold text-slate-600">
              <span>{t.nav.detail[0]}</span>
              <span>{t.warnings}</span>
              <span>{t.nextAction}</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function RolePanel({ locale, role }: { locale: Locale; role: RolePreview }) {
  const t = staffShellText[locale];
  const roles: RolePreview[] = ['staff', 'admin', 'management'];

  return (
    <section className="mb-4 rounded-md border border-slate-200 bg-slate-50 p-3" aria-label={t.role.label}>
      <p className="text-xs font-semibold text-slate-600">{t.role.label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {roles.map((candidate) => (
          <a
            className={`rounded-sm border px-2 py-1 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand ${
              candidate === role ? 'border-brand bg-brand text-brand-foreground' : 'border-slate-300 bg-white text-slate-700'
            }`}
            href={`?locale=${locale}&session=signed-in&role=${candidate}`}
            key={candidate}
          >
            {t.role[candidate]}
          </a>
        ))}
      </div>
    </section>
  );
}

function AuthPanel({ authError, isSignedIn, locale }: { authError: boolean; isSignedIn: boolean; locale: Locale }) {
  const t = staffShellText[locale];
  const previewQuery = `?locale=${locale}`;

  if (isSignedIn) {
    return (
      <section className="mb-4 rounded-md border border-slate-200 bg-slate-50 p-3" aria-label={t.auth.signedIn}>
        <p className="text-sm font-semibold">{t.auth.signedIn}</p>
        <a
          className="mt-3 inline-flex rounded-sm border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-white focus:outline-none focus:ring-2 focus:ring-brand"
          href={previewQuery}
        >
          {t.auth.logout}
        </a>
      </section>
    );
  }

  return (
    <section className="mb-4 rounded-md border border-slate-200 bg-slate-50 p-3" aria-label={t.auth.loginTitle}>
      <h2 className="text-sm font-semibold">{t.auth.loginTitle}</h2>
      {authError ? (
        <p className="mt-2 rounded-sm border border-red-200 bg-red-50 px-2 py-1 text-sm text-red-800" role="alert">
          {t.auth.genericError}
        </p>
      ) : null}
      <form className="mt-3 grid gap-2">
        <label className="grid gap-1 text-sm font-medium">
          {t.auth.identifier}
          <input className="rounded-sm border border-slate-300 px-3 py-2" name="identifier" autoComplete="username" />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          {t.auth.password}
          <input
            className="rounded-sm border border-slate-300 px-3 py-2"
            name="password"
            type="password"
            autoComplete="current-password"
          />
        </label>
        <button className="rounded-sm bg-brand px-3 py-2 text-sm font-semibold text-brand-foreground" type="button">
          {t.auth.submit}
        </button>
      </form>
      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
        <a className="text-brand underline" href={`${previewQuery}&session=signed-in`}>
          {t.auth.previewSignedIn}
        </a>
        <a className="text-brand underline" href={`${previewQuery}&auth=error`}>
          {t.auth.previewError}
        </a>
      </div>
    </section>
  );
}

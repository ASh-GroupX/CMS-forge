import { Bell, CheckSquare2, ClipboardList, FilePlus2, FolderCog, Gauge, GitBranch, Handshake, History, Inbox, Search, UsersRound } from 'lucide-react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import React from 'react';
import type { ReactNode } from 'react';
import { resolveLocale, staffShellText } from '../../i18n/staff-shell';
import { logoutStaffAction } from '../../lib/staff-auth-actions';
import { getStaffSessionPrincipal } from '../../lib/staff-session-api';
import { StaffTopBar } from '../staff-top-bar';

const NAV_ITEMS = [
  { key: 'today' as const, Icon: CheckSquare2, href: '/tasks/today' },
  { key: 'promises' as const, Icon: Handshake, href: '/tasks/promises' },
  { key: 'manager' as const, Icon: UsersRound, href: '/tasks/manager' },
  { key: 'handoff' as const, Icon: GitBranch, href: '/deals/handoff' },
  { key: 'dashboard' as const, Icon: Gauge, href: '/dashboard' },
  { key: 'queue' as const, Icon: Inbox, href: '/complaints' },
  { key: 'create' as const, Icon: FilePlus2, href: '/complaints/new' },
  { key: 'detail' as const, Icon: Search, href: '/complaints' },
  { key: 'admin' as const, Icon: FolderCog, href: '/admin' },
  { key: 'reports' as const, Icon: ClipboardList, href: '/reports' },
  { key: 'audit' as const, Icon: History, href: '/audit' },
  { key: 'notifications' as const, Icon: Bell, href: '/notifications' },
] as const;

type NavKey = (typeof NAV_ITEMS)[number]['key'];

const ROLE_NAV: Record<string, readonly NavKey[]> = {
  ADMIN: ['today', 'promises', 'manager', 'handoff', 'dashboard', 'queue', 'create', 'detail', 'admin', 'reports', 'audit', 'notifications'],
  CR_MANAGER: ['today', 'promises', 'manager', 'handoff', 'dashboard', 'queue', 'detail', 'reports', 'audit', 'notifications'],
  BRANCH_MANAGER: ['today', 'promises', 'manager', 'handoff', 'dashboard', 'queue', 'detail', 'reports', 'audit', 'notifications'],
  MGMT_READONLY: ['promises', 'manager', 'handoff', 'dashboard', 'queue', 'detail', 'reports', 'audit', 'notifications'],
};

const STAFF_NAV: readonly NavKey[] = ['today', 'promises', 'dashboard', 'queue', 'create', 'detail', 'notifications'];

export default async function StaffLayout({ children }: { children: ReactNode }) {
  const requestHeaders = await headers();
  const locale = resolveLocale(requestHeaders.get('x-cms-locale') ?? undefined);
  const t = staffShellText[locale];
  const principal = await getStaffSessionPrincipal();
  if (shouldRedirectStaffRoute(Boolean(principal), requestHeaders.get('x-cms-pathname') ?? '')) {
    redirect(`/?locale=${locale}`);
  }
  const allowedNav = principal ? (ROLE_NAV[principal.roleCode] ?? STAFF_NAV) : STAFF_NAV;
  const visibleItems = NAV_ITEMS.filter(({ key }) => (allowedNav as readonly string[]).includes(key));

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      dir={t.dir}
      lang={t.lang}
    >
      <StaffTopBar
        languageHref={`?locale=${locale === 'ar' ? 'en' : 'ar'}`}
        signedIn={principal ? t.auth.signedIn : t.auth.signedOut}
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
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">{t.subtitle}</p>
            <h1 className="text-2xl font-semibold tracking-normal">{t.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t.branch}</p>
            <p className="mt-2 inline-flex rounded-sm bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">
              {principal ? t.auth.signedIn : t.auth.signedOut}
            </p>
            {principal ? (
              <form action={logoutStaffAction}>
                <input name="locale" type="hidden" value={locale} />
                <button className="mt-3 rounded-sm border border-border bg-card px-3 py-2 text-sm font-semibold hover:bg-accent focus:outline-none focus:ring-2 focus:ring-brand" type="submit">
                  {t.auth.logout}
                </button>
              </form>
            ) : null}
          </div>
          <nav aria-label={t.title} className="grid gap-1">
            {visibleItems.map(({ key, Icon, href }) => {
              const [label, description] = t.nav[key];
              return (
                <a
                  className="grid grid-cols-[2rem_1fr] gap-2 rounded-sm px-2 py-2 text-start hover:bg-accent focus:outline-none focus:ring-2 focus:ring-brand"
                  href={`${href}?locale=${locale}`}
                  key={key}
                >
                  <Icon aria-hidden="true" className="mt-1 size-4 text-brand" />
                  <span>
                    <span className="block text-sm font-semibold">{label}</span>
                    <span className="block text-xs text-muted-foreground">{description}</span>
                  </span>
                </a>
              );
            })}
          </nav>
        </aside>
        <section className="grid content-start gap-4">{children}</section>
      </div>
    </div>
  );
}

export function shouldRedirectStaffRoute(hasPrincipal: boolean, pathname: string): boolean {
  return !hasPrincipal && !pathname.startsWith('/auth/reset');
}

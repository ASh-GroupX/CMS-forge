import { Bell, CheckSquare2, ClipboardList, FilePlus2, FolderCog, Gauge, GitBranch, Handshake, History, Inbox, Search, Send, UsersRound } from 'lucide-react';
import React, { type ReactNode } from 'react';
import { staffShellText, type Locale } from '../i18n/staff-shell';
import { StaffTopBar } from './staff-top-bar';

export const staffNavItems = [
  { key: 'today', Icon: CheckSquare2, href: '/tasks/today' },
  { key: 'sent', Icon: Send, href: '/tasks/sent' },
  { key: 'promises', Icon: Handshake, href: '/tasks/promises' },
  { key: 'handoff', Icon: GitBranch, href: '/deals/handoff' },
  { key: 'queue', Icon: Inbox, href: '/complaints' },
  { key: 'reports', Icon: ClipboardList, href: '/reports' },
  { key: 'manager', Icon: UsersRound, href: '/tasks/manager' },
  { key: 'dashboard', Icon: Gauge, href: '/dashboard' },
  { key: 'create', Icon: FilePlus2, href: '/complaints/new' },
  { key: 'detail', Icon: Search, href: '/complaints' },
  { key: 'admin', Icon: FolderCog, href: '/admin' },
  { key: 'audit', Icon: History, href: '/audit' },
  { key: 'notifications', Icon: Bell, href: '/notifications' },
] as const;

export type StaffNavKey = (typeof staffNavItems)[number]['key'];

export function AppShell({
  activePath = '',
  children,
  locale,
  navKeys,
  sidebarAfter,
  sidebarBefore,
  signedIn,
}: {
  activePath?: string;
  children: ReactNode;
  locale: Locale;
  navKeys: readonly StaffNavKey[];
  sidebarAfter?: ReactNode;
  sidebarBefore?: ReactNode;
  signedIn: boolean;
}) {
  const t = staffShellText[locale];
  const visibleItems = staffNavItems.filter(({ key }) => navKeys.includes(key));

  return (
    <main lang={t.lang} dir={t.dir} className="min-h-screen bg-surface-canvas text-content-strong">
      <a className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:rounded-sm focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:ring-2 focus:ring-brand" href="#staff-main">
        {t.skipToMain}
      </a>
      <StaffTopBar
        languageHref={`?locale=${locale === 'ar' ? 'en' : 'ar'}`}
        signedIn={signedIn ? t.auth.signedIn : t.auth.signedOut}
        subtitle={t.subtitle}
        switchLabel={t.switchLabel}
        switchTarget={t.switchTarget}
        themeDark={t.theme.dark}
        themeLabel={t.theme.label}
        themeLight={t.theme.light}
        title={t.title}
      />
      <div className="grid min-h-[calc(100dvh-4.5rem)] grid-cols-1 gap-4 p-4 md:p-6 lg:grid-cols-[18rem_1fr]">
        <aside className="order-2 rounded-md border border-line-subtle bg-surface p-3 shadow-sm lg:sticky lg:top-20 lg:order-1 lg:self-start">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-normal text-content-muted">{t.subtitle}</p>
            <h1 className="text-2xl font-semibold tracking-normal">{t.title}</h1>
            <p className="mt-1 text-sm text-content-muted">{t.branch}</p>
            <p className="mt-2 inline-flex rounded-sm bg-surface-raised px-2 py-1 text-xs font-semibold text-content-muted">
              {signedIn ? t.auth.signedIn : t.auth.signedOut}
            </p>
          </div>
          {sidebarBefore}
          <nav className="grid gap-1" aria-label={t.title}>
            {visibleItems.map(({ key, Icon, href }) => {
              const [label, description] = t.nav[key];
              const active = isActiveNav(key, href, activePath);
              return (
                <a
                  aria-current={active ? 'page' : undefined}
                  className={`grid grid-cols-[2rem_1fr] gap-2 rounded-sm px-2 py-2 text-start focus:outline-none focus:ring-2 focus:ring-brand ${active ? 'bg-surface-raised text-content-strong' : 'hover:bg-surface-raised'}`}
                  href={`${href}?locale=${locale}`}
                  key={key}
                >
                  <Icon aria-hidden="true" className="mt-1 size-4 text-brand" />
                  <span>
                    <span className="block text-sm font-semibold">{label}</span>
                    <span className="block text-xs text-content-muted">{description}</span>
                  </span>
                </a>
              );
            })}
          </nav>
          {sidebarAfter}
        </aside>
        <section className="order-1 grid min-w-0 content-start gap-4 lg:order-2" id="staff-main">{children}</section>
      </div>
    </main>
  );
}

export function isActiveNav(key: StaffNavKey, href: string, activePath: string): boolean {
  if (!activePath) return false;
  if (key === 'create') return activePath === '/complaints/new';
  if (key === 'detail') return /^\/complaints\/[^/]+/.test(activePath) && activePath !== '/complaints/new';
  if (key === 'queue') return activePath === '/complaints';
  return activePath === href || activePath.startsWith(`${href}/`);
}

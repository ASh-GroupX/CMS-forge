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
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="order-2 border-line-subtle bg-content-strong p-3 text-brand-foreground lg:sticky lg:top-0 lg:order-1 lg:h-screen lg:overflow-y-auto">
          <div className="mb-4 border-b border-brand-foreground/15 pb-3">
            <p className="text-xs font-semibold text-brand-foreground/65">{t.subtitle}</p>
            <h1 className="text-xl font-semibold tracking-normal">{t.title}</h1>
            <p className="mt-1 text-xs text-brand-foreground/65">{t.branch}</p>
          </div>
          {sidebarBefore}
          <nav className="grid gap-1" aria-label={t.title}>
            {visibleItems.map(({ key, Icon, href }) => {
              const [label, description] = t.nav[key];
              const active = isActiveNav(key, href, activePath);
              return (
                <a
                  aria-current={active ? 'page' : undefined}
                  aria-label={`${label}: ${description}`}
                  className={`grid grid-cols-[1.5rem_1fr] items-center gap-2 rounded-sm px-2 py-2 text-start text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand ${
                    active ? 'bg-brand text-brand-foreground' : 'text-brand-foreground/78 hover:bg-brand/15 hover:text-brand-foreground'
                  }`}
                  href={`${href}?locale=${locale}`}
                  key={key}
                  title={description}
                >
                  <Icon aria-hidden="true" className="size-4" />
                  <span className="truncate">{label}</span>
                </a>
              );
            })}
          </nav>
          {sidebarAfter}
        </aside>
        <div className="order-1 min-w-0 lg:order-2">
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
          <section className="grid min-w-0 content-start gap-3 p-3 md:p-4 xl:p-5" id="staff-main">{children}</section>
        </div>
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

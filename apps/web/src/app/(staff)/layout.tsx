import { Bell, ClipboardList, FilePlus2, FolderCog, Gauge, History, Inbox, Search } from 'lucide-react';
import { headers } from 'next/headers';
import React from 'react';
import type { ReactNode } from 'react';
import { resolveLocale, staffShellText } from '../../i18n/staff-shell';
import { getStaffSessionPrincipal } from '../../lib/staff-session-api';

const NAV_ITEMS = [
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
  ADMIN: ['dashboard', 'queue', 'create', 'detail', 'admin', 'reports', 'audit', 'notifications'],
  CR_MANAGER: ['dashboard', 'queue', 'detail', 'reports', 'audit', 'notifications'],
  BRANCH_MANAGER: ['dashboard', 'queue', 'detail', 'reports', 'audit', 'notifications'],
  MGMT_READONLY: ['dashboard', 'queue', 'detail', 'reports', 'audit', 'notifications'],
};

const STAFF_NAV: readonly NavKey[] = ['dashboard', 'queue', 'create', 'detail', 'notifications'];

export default async function StaffLayout({ children }: { children: ReactNode }) {
  const locale = resolveLocale((await headers()).get('x-cms-locale') ?? undefined);
  const t = staffShellText[locale];
  const principal = await getStaffSessionPrincipal();
  const allowedNav = principal ? (ROLE_NAV[principal.roleCode] ?? STAFF_NAV) : STAFF_NAV;
  const visibleItems = NAV_ITEMS.filter(({ key }) => (allowedNav as readonly string[]).includes(key));

  return (
    <div
      className="min-h-screen bg-neutral p-4 text-neutral-foreground md:p-6"
      dir={t.dir}
      lang={t.lang}
    >
      <div className="grid min-h-[calc(100vh-2rem)] grid-cols-1 gap-4 md:min-h-[calc(100vh-3rem)] lg:grid-cols-[18rem_1fr]">
        <aside className="rounded-md border border-slate-200 bg-white p-3 shadow-sm">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">{t.subtitle}</p>
            <h1 className="text-2xl font-semibold tracking-normal">{t.title}</h1>
            <p className="mt-1 text-sm text-slate-600">{t.branch}</p>
            <p className="mt-2 inline-flex rounded-sm bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
              {principal ? t.auth.signedIn : t.auth.signedOut}
            </p>
          </div>
          <nav aria-label={t.title} className="grid gap-1">
            {visibleItems.map(({ key, Icon, href }) => {
              const [label, description] = t.nav[key];
              return (
                <a
                  className="grid grid-cols-[2rem_1fr] gap-2 rounded-sm px-2 py-2 text-start hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-brand"
                  href={href}
                  key={key}
                >
                  <Icon aria-hidden="true" className="mt-1 size-4 text-brand" />
                  <span>
                    <span className="block text-sm font-semibold">{label}</span>
                    <span className="block text-xs text-slate-600">{description}</span>
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

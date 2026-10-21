import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import React from 'react';
import type { ReactNode } from 'react';
import { resolveLocale, staffShellText } from '../../i18n/staff-shell';
import { logoutStaffAction } from '../../lib/staff-auth-actions';
import { getStaffSessionPrincipal } from '../../lib/staff-session-api';
import { AppShell, type StaffNavKey } from '../app-shell';

const ROLE_NAV: Record<string, readonly StaffNavKey[]> = {
  ADMIN: ['dashboard', 'internalTickets', 'complaints', 'customers', 'tasks', 'communication', 'reports', 'admin', 'audit'],
  CR_MANAGER: ['dashboard', 'internalTickets', 'complaints', 'customers', 'tasks', 'communication', 'reports', 'audit'],
  BRANCH_MANAGER: ['dashboard', 'internalTickets', 'complaints', 'customers', 'tasks', 'communication', 'reports', 'audit'],
  MGMT_READONLY: ['dashboard', 'internalTickets', 'complaints', 'customers', 'tasks', 'reports', 'audit'],
};

const STAFF_NAV: readonly StaffNavKey[] = ['dashboard', 'internalTickets', 'complaints', 'customers', 'tasks', 'communication', 'reports'];

const ROUTE_NAV_MAP: Array<{ prefix: string; key: StaffNavKey; defaultPath: string }> = [
  { prefix: '/internal-tickets', key: 'internalTickets', defaultPath: '/internal-tickets' },
  { prefix: '/complaints', key: 'complaints', defaultPath: '/complaints' },
  { prefix: '/customers', key: 'customers', defaultPath: '/customers' },
  { prefix: '/communication', key: 'communication', defaultPath: '/communication' },
  { prefix: '/reports', key: 'reports', defaultPath: '/reports' },
  { prefix: '/admin', key: 'admin', defaultPath: '/admin' },
  { prefix: '/audit', key: 'audit', defaultPath: '/audit' },
  { prefix: '/tasks', key: 'tasks', defaultPath: '/tasks' },
  { prefix: '/dashboard', key: 'dashboard', defaultPath: '/dashboard' },
];

export default async function StaffLayout({ children }: { children: ReactNode }) {
  const requestHeaders = await headers();
  const locale = resolveLocale(requestHeaders.get('x-cms-locale') ?? undefined);
  const t = staffShellText[locale];
  const principal = await getStaffSessionPrincipal();
  const activePath = requestHeaders.get('x-cms-pathname') ?? '';
  const activeSearch = requestHeaders.get('x-cms-search') ?? '';
  if (shouldRedirectStaffRoute(Boolean(principal), activePath)) {
    redirect(`/?locale=${locale}`);
  }
  const allowedNav = principal
    ? navForPrincipal(principal.roleCode, principal.permissions, {
        viewMode: principal.viewMode,
        allowedNavKeys: principal.allowedNavKeys,
      })
    : STAFF_NAV;

  if (activePath && isRouteForbidden(activePath, allowedNav)) {
    redirect(firstAllowedPath(allowedNav, locale));
  }

  return (
    <AppShell
      activePath={activePath}
      activeSearch={activeSearch}
      locale={locale}
      navKeys={allowedNav}
      principal={principal}
      sidebarBefore={principal ? (
        <form action={logoutStaffAction} className="mb-4">
          <input name="locale" type="hidden" value={locale} />
          <button className="rounded-sm border border-line-subtle bg-surface px-3 py-2 text-sm font-semibold hover:bg-surface-raised focus:outline-none focus:ring-2 focus:ring-brand" type="submit">
            {t.auth.logout}
          </button>
        </form>
      ) : null}
    >
      {children}
    </AppShell>
  );
}

export function shouldRedirectStaffRoute(hasPrincipal: boolean, pathname: string): boolean {
  return !hasPrincipal && !pathname.startsWith('/auth/reset');
}

export function firstAllowedPath(allowedNav: readonly StaffNavKey[], locale: string): string {
  for (const item of ROUTE_NAV_MAP) {
    if (allowedNav.includes(item.key)) {
      return `${item.defaultPath}?locale=${locale}`;
    }
  }
  return `/?locale=${locale}`;
}

export function isRouteForbidden(pathname: string, allowedNav: readonly StaffNavKey[]): boolean {
  for (const item of ROUTE_NAV_MAP) {
    if (pathname === item.prefix || pathname.startsWith(`${item.prefix}/`)) {
      return !allowedNav.includes(item.key);
    }
  }
  return false;
}

export function navForPrincipal(
  roleCode: string,
  permissions: readonly string[],
  userRules?: { viewMode?: string | null | undefined; allowedNavKeys?: readonly string[] | null | undefined },
): readonly StaffNavKey[] {
  const has = (permission: string) => permissions.includes(permission);
  const base = ROLE_NAV[roleCode] ?? STAFF_NAV;
  const canAdmin = has('USERS_MANAGE') || has('ROLES_MANAGE') || has('MASTER_DATA_MANAGE') || has('NOTIFICATIONS_MANAGE');
  let nav: readonly StaffNavKey[] = canAdmin && !base.includes('admin') ? [...base, 'admin' as const] : base;
  nav = nav.filter((key) => {
    if (key === 'admin') return canAdmin;
    if (key === 'audit') return has('AUDIT_VIEW');
    if (key === 'reports') return has('REPORT_VIEW');
    return true;
  });

  if (userRules?.viewMode === 'CRM') {
    nav = nav.filter((key) => key !== 'internalTickets');
  } else if (userRules?.viewMode === 'INTERNAL_TICKETS') {
    nav = nav.filter((key) => key === 'internalTickets' || key === 'dashboard' || key === 'tasks' || key === 'admin' || key === 'audit');
  } else if (userRules?.viewMode === 'CUSTOM' || (userRules?.allowedNavKeys && userRules.allowedNavKeys.length > 0)) {
    const customAllowed = new Set(userRules.allowedNavKeys ?? []);
    nav = nav.filter((key) => customAllowed.has(key));
  }

  return nav;
}

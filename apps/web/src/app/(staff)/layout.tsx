import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import React from 'react';
import type { ReactNode } from 'react';
import { resolveLocale, staffShellText } from '../../i18n/staff-shell';
import { logoutStaffAction } from '../../lib/staff-auth-actions';
import { getStaffSessionPrincipal } from '../../lib/staff-session-api';
import { AppShell, type StaffNavKey } from '../app-shell';

const ROLE_NAV: Record<string, readonly StaffNavKey[]> = {
  ADMIN: ['today', 'sent', 'promises', 'handoff', 'queue', 'reports', 'manager', 'dashboard', 'create', 'admin', 'audit', 'notifications', 'groups'],
  CR_MANAGER: ['today', 'sent', 'promises', 'handoff', 'queue', 'reports', 'manager', 'dashboard', 'audit', 'notifications', 'groups'],
  BRANCH_MANAGER: ['today', 'sent', 'promises', 'handoff', 'queue', 'reports', 'manager', 'dashboard', 'audit', 'notifications', 'groups'],
  MGMT_READONLY: ['promises', 'handoff', 'queue', 'reports', 'manager', 'dashboard', 'audit', 'notifications', 'groups'],
};

const STAFF_NAV: readonly StaffNavKey[] = ['today', 'sent', 'promises', 'handoff', 'queue', 'reports', 'dashboard', 'create', 'notifications', 'groups'];

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
  const allowedNav = principal ? navForPrincipal(ROLE_NAV[principal.roleCode] ?? STAFF_NAV, principal.permissions) : STAFF_NAV;

  return (
    <AppShell
      activePath={activePath}
      activeSearch={activeSearch}
      locale={locale}
      navKeys={allowedNav}
      signedIn={Boolean(principal)}
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

function navForPrincipal(nav: readonly StaffNavKey[], permissions: readonly string[]): readonly StaffNavKey[] {
  const has = (permission: string) => permissions.includes(permission);
  return nav.filter((key) => {
    if (key === 'admin') return has('USERS_MANAGE') || has('ROLES_MANAGE') || has('MASTER_DATA_MANAGE') || has('NOTIFICATIONS_MANAGE');
    if (key === 'audit') return has('AUDIT_VIEW');
    if (key === 'handoff') return has('COMPLAINT_ASSIGN');
    if (key === 'reports' || key === 'dashboard' || key === 'manager' || key === 'promises') return has('REPORT_VIEW');
    if (key === 'create') return has('COMPLAINT_CREATE');
    return true;
  });
}

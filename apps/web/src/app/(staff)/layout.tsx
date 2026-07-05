import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import React from 'react';
import type { ReactNode } from 'react';
import { resolveLocale, staffShellText } from '../../i18n/staff-shell';
import { logoutStaffAction } from '../../lib/staff-auth-actions';
import { getStaffSessionPrincipal } from '../../lib/staff-session-api';
import { AppShell, type StaffNavKey } from '../app-shell';

const ROLE_NAV: Record<string, readonly StaffNavKey[]> = {
  ADMIN: ['today', 'sent', 'promises', 'handoff', 'queue', 'reports', 'manager', 'dashboard', 'create', 'admin', 'audit', 'notifications'],
  CR_MANAGER: ['today', 'sent', 'promises', 'handoff', 'queue', 'reports', 'manager', 'dashboard', 'audit', 'notifications'],
  BRANCH_MANAGER: ['today', 'sent', 'promises', 'handoff', 'queue', 'reports', 'manager', 'dashboard', 'audit', 'notifications'],
  MGMT_READONLY: ['promises', 'handoff', 'queue', 'reports', 'manager', 'dashboard', 'audit', 'notifications'],
};

const STAFF_NAV: readonly StaffNavKey[] = ['today', 'sent', 'promises', 'handoff', 'queue', 'reports', 'dashboard', 'create', 'notifications'];

export default async function StaffLayout({ children }: { children: ReactNode }) {
  const requestHeaders = await headers();
  const locale = resolveLocale(requestHeaders.get('x-cms-locale') ?? undefined);
  const t = staffShellText[locale];
  const principal = await getStaffSessionPrincipal();
  const activePath = requestHeaders.get('x-cms-pathname') ?? '';
  if (shouldRedirectStaffRoute(Boolean(principal), activePath)) {
    redirect(`/?locale=${locale}`);
  }
  const allowedNav = principal ? (ROLE_NAV[principal.roleCode] ?? STAFF_NAV) : STAFF_NAV;

  return (
    <AppShell
      activePath={activePath}
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

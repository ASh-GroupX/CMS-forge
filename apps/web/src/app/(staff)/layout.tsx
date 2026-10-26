import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import React from 'react';
import type { ReactNode } from 'react';
import { resolveLocale, staffShellText } from '../../i18n/staff-shell';
import { logoutStaffAction } from '../../lib/staff-auth-actions';
import { getStaffSessionPrincipal } from '../../lib/staff-session-api';
import {
  STAFF_NAV,
  firstAllowedPath,
  isRouteForbidden,
  navForPrincipal,
  shouldRedirectStaffRoute,
} from '../../lib/staff-nav-rules';
import { AppShell } from '../app-shell';

export {
  firstAllowedPath,
  isRouteForbidden,
  navForPrincipal,
  shouldRedirectStaffRoute,
  ROUTE_NAV_MAP,
  STAFF_NAV,
  ROLE_NAV,
} from '../../lib/staff-nav-rules';

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

  if (activePath && isRouteForbidden(activePath, allowedNav, principal?.allowedNavKeys)) {
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

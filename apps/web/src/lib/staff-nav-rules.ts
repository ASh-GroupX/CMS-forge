import type { StaffNavKey } from '../app/app-shell';

export const ROLE_NAV: Record<string, readonly StaffNavKey[]> = {
  ADMIN: ['dashboard', 'internalTickets', 'serviceBooking', 'complaints', 'customers', 'tasks', 'communication', 'reports', 'admin', 'audit'],
  CR_MANAGER: ['dashboard', 'internalTickets', 'serviceBooking', 'complaints', 'customers', 'tasks', 'communication', 'reports', 'audit'],
  BRANCH_MANAGER: ['dashboard', 'internalTickets', 'serviceBooking', 'complaints', 'customers', 'tasks', 'communication', 'reports', 'audit'],
  MGMT_READONLY: ['dashboard', 'internalTickets', 'serviceBooking', 'complaints', 'customers', 'tasks', 'reports', 'audit'],
};

export const STAFF_NAV: readonly StaffNavKey[] = ['dashboard', 'internalTickets', 'serviceBooking', 'complaints', 'customers', 'tasks', 'communication', 'reports'];

export const ROUTE_NAV_MAP: Array<{ prefix: string; key: StaffNavKey; defaultPath: string }> = [
  { prefix: '/dashboard', key: 'dashboard', defaultPath: '/dashboard' },
  { prefix: '/internal-tickets', key: 'internalTickets', defaultPath: '/internal-tickets' },
  { prefix: '/complaints', key: 'complaints', defaultPath: '/complaints' },
  { prefix: '/service-booking', key: 'serviceBooking', defaultPath: '/service-booking' },
  { prefix: '/customers', key: 'customers', defaultPath: '/customers' },
  { prefix: '/tasks', key: 'tasks', defaultPath: '/tasks' },
  { prefix: '/communication', key: 'communication', defaultPath: '/communication' },
  { prefix: '/reports', key: 'reports', defaultPath: '/reports' },
  { prefix: '/admin', key: 'admin', defaultPath: '/admin' },
  { prefix: '/audit', key: 'audit', defaultPath: '/audit' },
];

export function shouldRedirectStaffRoute(hasPrincipal: boolean, pathname: string): boolean {
  return !hasPrincipal && !pathname.startsWith('/auth/reset');
}

export function firstAllowedPath(allowedNav: readonly StaffNavKey[], locale: string): string {
  for (const item of ROUTE_NAV_MAP) {
    if (allowedNav.includes(item.key)) {
      return `${item.defaultPath}?locale=${locale}`;
    }
  }
  return `/dashboard?locale=${locale}`;
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

  if (userRules?.allowedNavKeys && userRules.allowedNavKeys.length > 0) {
    const customAllowed = new Set(userRules.allowedNavKeys);
    nav = nav.filter((key) => customAllowed.has(key));
  } else if (userRules?.viewMode === 'CRM') {
    nav = nav.filter((key) => key !== 'internalTickets');
  } else if (userRules?.viewMode === 'INTERNAL_TICKETS') {
    nav = nav.filter((key) => key === 'internalTickets' || key === 'dashboard' || key === 'tasks' || key === 'admin' || key === 'audit');
  }

  if (nav.length === 0) {
    const fallback = base[0];
    nav = fallback ? [fallback] : ['dashboard'];
  }

  return nav;
}

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

export const ADMIN_SECTIONS = [
  { key: 'admin:users', path: '/admin/users', labelEn: 'Users & Staff', labelAr: 'المستخدمين والموظفين', requiredPerm: 'USERS_MANAGE' },
  { key: 'admin:roles', path: '/admin/roles', labelEn: 'Roles & Permissions', labelAr: 'الأدوار والصلاحيات', requiredPerm: 'ROLES_MANAGE' },
  { key: 'admin:branches', path: '/admin/branches', labelEn: 'Branches', labelAr: 'الفروع', requiredPerm: 'MASTER_DATA_MANAGE' },
  { key: 'admin:categories', path: '/admin/categories', labelEn: 'Complaint Categories', labelAr: 'تصنيفات الشكاوى', requiredPerm: 'MASTER_DATA_MANAGE' },
  { key: 'admin:sla', path: '/admin/sla', labelEn: 'SLA Policies', labelAr: 'سياسات مستوى الخدمة SLA', requiredPerm: 'MASTER_DATA_MANAGE' },
  { key: 'admin:notification-templates', path: '/admin/notification-templates', labelEn: 'Notification Templates', labelAr: 'قوالب الإشعارات', requiredPerm: 'NOTIFICATIONS_MANAGE' },
  { key: 'admin:standard-problems', path: '/admin/standard-problems', labelEn: 'Standard Problems', labelAr: 'المشكلات الشائعة', requiredPerm: 'MASTER_DATA_MANAGE' },
  { key: 'admin:complaint-templates', path: '/admin/complaint-templates', labelEn: 'Complaint Templates', labelAr: 'قوالب الردود للشكاوى', requiredPerm: 'MASTER_DATA_MANAGE' },
  { key: 'admin:ticket-settings', path: '/admin/ticket-settings', labelEn: 'Ticket Settings', labelAr: 'إعدادات التذاكر الداخلية', requiredPerm: 'TICKET_SETTINGS_MANAGE' },
  { key: 'admin:internal-tickets', path: '/admin/internal-tickets', labelEn: 'Internal Tickets Admin', labelAr: 'إدارة التذاكر الداخلية', requiredPerm: 'TICKET_SETTINGS_MANAGE' },
  { key: 'admin:complaint-settings', path: '/admin/complaint-settings', labelEn: 'Complaint Settings', labelAr: 'إعدادات الشكاوى', requiredPerm: 'COMPLAINT_SETTINGS_MANAGE' },
  { key: 'admin:booking-settings', path: '/admin/booking-settings', labelEn: 'Service Booking Settings', labelAr: 'إعدادات حجز الصيانة', requiredPerm: 'BOOKING_SETTINGS_MANAGE' },
] as const;

export function canAccessAdminSection(
  sectionKey: string,
  allowedNavKeys?: readonly string[] | null | undefined,
  permissions?: readonly string[],
  roleCode?: string,
): boolean {
  if (!roleCode && !permissions && (!allowedNavKeys || allowedNavKeys.length === 0)) {
    return true;
  }

  if (roleCode === 'ADMIN' && (!allowedNavKeys || allowedNavKeys.length === 0)) {
    return true;
  }

  if (allowedNavKeys && allowedNavKeys.length > 0) {
    if (allowedNavKeys.includes(sectionKey)) return true;
    const hasAnyAdminSubkey = allowedNavKeys.some((k) => k.startsWith('admin:'));
    if (allowedNavKeys.includes('admin') && !hasAnyAdminSubkey) {
      return true;
    }
    return false;
  }

  if (!permissions) return false;
  const section = ADMIN_SECTIONS.find((s) => s.key === sectionKey);
  if (!section) return false;
  return permissions.includes(section.requiredPerm);
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
  return `/dashboard?locale=${locale}`;
}

export function isRouteForbidden(
  pathname: string,
  allowedNav: readonly StaffNavKey[],
  allowedNavKeys?: readonly string[] | null | undefined,
): boolean {
  for (const item of ROUTE_NAV_MAP) {
    if (pathname === item.prefix || pathname.startsWith(`${item.prefix}/`)) {
      if (!allowedNav.includes(item.key)) {
        return true;
      }
      if (item.key === 'admin' && pathname !== '/admin') {
        if (allowedNavKeys && allowedNavKeys.length > 0) {
          const hasSpecificSubkeys = allowedNavKeys.some((k) => k.startsWith('admin:'));
          if (hasSpecificSubkeys) {
            const matching = ADMIN_SECTIONS.find((s) => pathname === s.path || pathname.startsWith(`${s.path}/`));
            if (matching && !allowedNavKeys.includes(matching.key)) {
              return true;
            }
          }
        }
      }
      return false;
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
  const hasAdminPerm =
    has('USERS_MANAGE') ||
    has('ROLES_MANAGE') ||
    has('MASTER_DATA_MANAGE') ||
    has('NOTIFICATIONS_MANAGE') ||
    has('BOOKING_SETTINGS_MANAGE') ||
    has('COMPLAINT_SETTINGS_MANAGE') ||
    has('TICKET_SETTINGS_MANAGE');
  const hasAdminNavKey = Boolean(
    userRules?.allowedNavKeys?.some((k) => k === 'admin' || k.startsWith('admin:')),
  );
  const canAdmin = hasAdminPerm || hasAdminNavKey;

  let nav: readonly StaffNavKey[] = canAdmin && !base.includes('admin') ? [...base, 'admin' as const] : base;
  nav = nav.filter((key) => {
    if (key === 'admin') return canAdmin;
    if (key === 'audit') return has('AUDIT_VIEW');
    if (key === 'reports') return has('REPORT_VIEW');
    return true;
  });

  if (userRules?.allowedNavKeys && userRules.allowedNavKeys.length > 0) {
    const customAllowed = new Set(userRules.allowedNavKeys);
    const allowAdmin =
      customAllowed.has('admin') ||
      Array.from(customAllowed).some((k) => k.startsWith('admin:'));
    nav = nav.filter((key) => {
      if (key === 'admin') return allowAdmin;
      return customAllowed.has(key);
    });
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

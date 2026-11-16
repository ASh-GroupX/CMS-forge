const builtInRoles = new Set(['ADMIN', 'CR_MANAGER', 'CR_OFFICER', 'BRANCH_MANAGER', 'MGMT_READONLY', 'CUSTOMER_PORTAL']);

const navigationKeys: Record<string, string> = {
  ROLE_NAV_REDIRECT_COMPLAINTS: 'redirectComplaints',
  ROLE_NAV_DASHBOARD: 'dashboard',
  ROLE_NAV_INTERNAL_TICKETS: 'internalTickets',
  ROLE_NAV_SERVICE_BOOKING: 'serviceBooking',
  ROLE_NAV_COMPLAINTS: 'complaints',
  ROLE_NAV_CUSTOMERS: 'customers',
  ROLE_NAV_TASKS: 'tasks',
  ROLE_NAV_COMMUNICATION: 'communication',
  ROLE_NAV_REPORTS: 'reports',
  ROLE_NAV_AUDIT: 'audit',
  ROLE_NAV_ADMIN_PORTAL_INTAKE: 'admin:portal-intake',
  ROLE_NAV_ADMIN_USERS: 'admin:users',
  ROLE_NAV_ADMIN_ROLES: 'admin:roles',
  ROLE_NAV_ADMIN_BRANCHES: 'admin:branches',
  ROLE_NAV_ADMIN_CATEGORIES: 'admin:categories',
  ROLE_NAV_ADMIN_SLA: 'admin:sla',
  ROLE_NAV_ADMIN_NOTIFICATION_TEMPLATES: 'admin:notification-templates',
  ROLE_NAV_ADMIN_STANDARD_PROBLEMS: 'admin:standard-problems',
  ROLE_NAV_ADMIN_COMPLAINT_TEMPLATES: 'admin:complaint-templates',
  ROLE_NAV_ADMIN_TICKET_SETTINGS: 'admin:ticket-settings',
  ROLE_NAV_ADMIN_INTERNAL_TICKETS: 'admin:internal-tickets',
  ROLE_NAV_ADMIN_COMPLAINT_SETTINGS: 'admin:complaint-settings',
  ROLE_NAV_ADMIN_BOOKING_SETTINGS: 'admin:booking-settings',
  ROLE_NAV_ADMIN_API_KEYS: 'admin:api-keys',
};

export function roleNavigationDefaults(input: {
  roleCode: string;
  permissionCodes: readonly string[];
  viewMode?: string | null | undefined;
  allowedNavKeys?: readonly string[] | null | undefined;
}): { viewMode: string; allowedNavKeys: string[] } {
  const personalMode = input.viewMode ?? 'BOTH';
  const personalKeys = input.allowedNavKeys ?? [];
  if (builtInRoles.has(input.roleCode) || personalMode !== 'BOTH' || personalKeys.length) {
    return { viewMode: personalMode, allowedNavKeys: [...personalKeys] };
  }
  const roleKeys = input.permissionCodes.flatMap((code) => navigationKeys[code] ? [navigationKeys[code]] : []);
  if (roleKeys.some((key) => key?.startsWith('admin:')) && !roleKeys.includes('admin')) roleKeys.push('admin');
  if (roleKeys.length) return { viewMode: 'CUSTOM', allowedNavKeys: roleKeys };
  const roleMode = input.permissionCodes.includes('ROLE_VIEW_CRM') ? 'CRM'
    : input.permissionCodes.includes('ROLE_VIEW_INTERNAL_TICKETS') ? 'INTERNAL_TICKETS' : 'BOTH';
  return { viewMode: roleMode, allowedNavKeys: [] };
}

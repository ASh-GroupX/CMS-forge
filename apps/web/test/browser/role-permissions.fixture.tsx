import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { AdminRoles } from '../../src/components/admin-roles';
import type { AdminPermission, AdminRolesData } from '../../src/lib/staff-admin-roles-api';
import type { Locale } from '../../src/i18n/staff-shell';

const permission = (code: string, nameEn: string, nameAr: string): AdminPermission => ({ id: code, code, nameEn, nameAr });
export const roleData: AdminRolesData = {
  permissions: [
    permission('STAFF_LOGIN', 'Staff login', 'دخول الموظفين'),
    permission('ROLE_VIEW_BOTH', 'View: all workspaces', 'العرض: جميع الأقسام'),
    permission('ROLE_VIEW_CRM', 'View: CRM only', 'العرض: نظام العملاء فقط'),
    permission('ROLE_VIEW_CUSTOM', 'View: selected pages', 'العرض: صفحات محددة'),
    permission('ROLE_NAV_SERVICE_BOOKING', 'Page: service booking', 'الصفحة: حجوزات الصيانة'),
    permission('ROLE_NAV_ADMIN_BOOKING_SETTINGS', 'Admin page: booking settings', 'صفحة الإدارة: إعدادات الحجز'),
  ],
  roles: [{ id: 'admin', code: 'ADMIN', nameEn: 'Administrator', nameAr: 'مدير النظام', isActive: true,
    isSystem: true, permissions: [permission('STAFF_LOGIN', 'Staff login', 'دخول الموظفين')],
    updatedAt: '2026-11-16T00:00:00.000Z', affectedActiveUserCount: 1 }],
};

export function RolePermissionsFixture({ locale }: { locale: Locale }) {
  return <AdminRoles createAction={() => undefined} data={roleData} locale={locale} updateAction={() => undefined} />;
}

if (typeof window !== 'undefined') {
  const root = document.getElementById('root');
  if (root) hydrateRoot(root, <RolePermissionsFixture locale={root.dataset.locale === 'ar' ? 'ar' : 'en'} />);
}

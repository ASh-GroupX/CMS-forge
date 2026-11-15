'use client';

import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { UserNavRulesForm } from '../../src/components/admin-users-roles/user-nav-rules-form';
import type { AdminUser } from '../../src/lib/staff-admin-users-api';

const user: AdminUser = {
  id: 'staff-qr', email: 'staff@example.test', nameEn: 'Booking Staff', nameAr: 'موظف الحجوزات',
  roleCode: 'CR_OFFICER', roleName: 'CR Officer', branchId: 'amman', branchName: 'Amman',
  departmentId: null, departmentName: null, isActive: true, viewMode: 'BOTH', allowedNavKeys: [],
};

export function PortalIntakeGrantFixture({ locale }: { locale: 'en' | 'ar' }) {
  return <main className="mx-auto max-w-3xl bg-surface p-6" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
    <h1 className="mb-4 text-xl font-semibold">{locale === 'ar' ? 'صلاحيات الموظف' : 'Staff access'}</h1>
    <UserNavRulesForm locale={locale} user={user} action={(form) => {
      (window as Window & { savedQrGrant?: { viewMode: string; keys: string[] } }).savedQrGrant = {
        viewMode: String(form.get('viewMode')),
        keys: form.getAll('allowedNavKeys').map(String),
      };
    }} />
  </main>;
}

if (typeof document !== 'undefined') {
  hydrateRoot(document.getElementById('root')!, <PortalIntakeGrantFixture locale={document.documentElement.lang === 'ar' ? 'ar' : 'en'} />);
}

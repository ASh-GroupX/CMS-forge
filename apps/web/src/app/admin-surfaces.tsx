import React from 'react';
import type { Locale } from '../i18n/staff-shell';
import { AdminBranchesDepartments } from './admin-branches-departments';
import { AdminCategoriesSla, type AdminConfigPreviewState } from './admin-categories-sla';
import { AdminNotificationTemplates } from './admin-notification-templates';
import { AdminUsersRoles } from './admin-users-roles';
import { AuditViewer } from './audit-viewer';

export type AdminPreviewState = AdminConfigPreviewState;

export function AdminSurfaces({ locale, state }: { locale: Locale; state?: AdminPreviewState | undefined }) {
  return (
    <>
      <AdminBranchesDepartments locale={locale} state={state} />
      <AdminUsersRoles locale={locale} state={state} />
      <AdminCategoriesSla locale={locale} state={state} />
      <AdminNotificationTemplates locale={locale} state={state} />
      <AuditViewer locale={locale} state={state} />
    </>
  );
}

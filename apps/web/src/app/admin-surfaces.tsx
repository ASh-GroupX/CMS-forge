import React from 'react';
import { confirmationText } from '../i18n/staff-confirmations';
import type { Locale } from '../i18n/staff-shell';
import { AdminBranchesDepartments } from './admin-branches-departments';
import { AdminCategoriesSla, type AdminConfigPreviewState } from './admin-categories-sla';
import { AdminNotificationTemplates } from './admin-notification-templates';
import { AdminUsersRoles } from './admin-users-roles';
import { AuditViewer } from './audit-viewer';

export type AdminPreviewState = AdminConfigPreviewState;

export function AdminSurfaces({ locale, state }: { locale: Locale; state?: AdminPreviewState | undefined }) {
  const confirm = confirmationText[locale].deactivate;
  return (
    <>
      <section className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900" role="alert" aria-label={confirm.title}>
        <h2 className="font-semibold">{confirm.title}</h2>
        <p className="mt-1">{confirm.body}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="rounded-sm border border-red-300 bg-white px-3 py-2 text-sm font-semibold" type="button">{confirm.confirm}</button>
          <button className="rounded-sm border border-slate-300 bg-white px-3 py-2 text-sm font-semibold" type="button">{confirm.cancel}</button>
        </div>
      </section>
      <AdminBranchesDepartments locale={locale} state={state} />
      <AdminUsersRoles locale={locale} state={state} />
      <AdminCategoriesSla locale={locale} state={state} />
      <AdminNotificationTemplates locale={locale} state={state} />
      <AuditViewer locale={locale} state={state} />
    </>
  );
}

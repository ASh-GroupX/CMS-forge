import React from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { confirmationText } from '../../i18n/staff-confirmations';
import type { Locale } from '../../i18n/staff-shell';
import { AdminBranchesDepartments } from '../admin-branches-departments';
import { AdminCategoriesSla, type AdminConfigPreviewState } from '../admin-categories-sla';
import { AdminNotificationTemplates } from '../admin-notification-templates';
import { AdminUsersRoles } from '../admin-users-roles';

export type AdminPreviewState = AdminConfigPreviewState;

export function AdminSurfaces({ locale, state }: { locale: Locale; state?: AdminPreviewState | undefined }) {
  const confirm = confirmationText[locale].deactivate;
  return (
    <>
      <Card className="rounded-md border-destructive/30 bg-destructive/10 text-destructive shadow-sm" role="alert" aria-label={confirm.title}>
        <CardHeader className="p-3 pb-0">
          <CardTitle className="text-sm tracking-normal">{confirm.title}</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-1 text-sm">
          <p>{confirm.body}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" variant="destructive">{confirm.confirm}</Button>
            <Button type="button" variant="outline">{confirm.cancel}</Button>
          </div>
        </CardContent>
      </Card>
      <AdminBranchesDepartments locale={locale} state={state} />
      <AdminUsersRoles locale={locale} state={state} />
      <AdminCategoriesSla locale={locale} state={state} />
      <AdminNotificationTemplates locale={locale} state={state} />
    </>
  );
}

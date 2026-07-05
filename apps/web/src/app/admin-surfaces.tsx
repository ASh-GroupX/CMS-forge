import React from 'react';
import { AdminSurfaces as AdminConfigurationSurfaces } from '../components/admin-surfaces';
import type { AdminFixtureState } from '../components/admin-surfaces';
import type { Locale } from '../i18n/staff-shell';
import { AuditViewer } from './audit-viewer';

export type { AdminFixtureState } from '../components/admin-surfaces';

export function AdminSurfaces({ locale, state }: { locale: Locale; state?: AdminFixtureState | undefined }) {
  return (
    <>
      <AdminConfigurationSurfaces locale={locale} state={state} />
      <AuditViewer locale={locale} state={state} />
    </>
  );
}

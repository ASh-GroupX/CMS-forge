import React from 'react';
import { redirect } from 'next/navigation';
import { getStaffSessionPrincipal } from '../../../../lib/staff-session-api';
import { resolveLocale } from '../../../../i18n/staff-shell';
import { portalIntakeText } from '../../../../i18n/portal-intake';
import { loadIntakeSettings } from './actions';
import { PortalIntakeSettings } from '../../../../components/portal-intake-settings';
export const dynamic = 'force-dynamic';
export default async function Page({ searchParams }: { searchParams?: Promise<{ locale?: string }> }) {
  const locale = resolveLocale((await searchParams)?.locale);
  const principal = await getStaffSessionPrincipal();
  if (!principal) redirect('/');
  if (principal.roleCode !== 'ADMIN') return <p role="alert">{portalIntakeText[locale].forbidden}</p>;
  return <PortalIntakeSettings locale={locale} initial={await loadIntakeSettings()} />;
}

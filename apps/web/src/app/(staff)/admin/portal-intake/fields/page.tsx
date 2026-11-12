import React from 'react';
import { redirect } from 'next/navigation';
import { getStaffSessionPrincipal } from '../../../../../lib/staff-session-api';
import { resolveLocale } from '../../../../../i18n/staff-shell';
import { PortalFieldsSettings } from '../../../../../components/portal-intake-fields';
import { loadPortalFields } from './actions';
export const dynamic = 'force-dynamic';
export default async function Page({ searchParams }: { searchParams?: Promise<{ locale?: string }> }) {
  const locale = resolveLocale((await searchParams)?.locale);
  const principal = await getStaffSessionPrincipal();
  if (!principal) redirect('/');
  if (principal.roleCode !== 'ADMIN') return <p role="alert">{locale === 'ar' ? 'غير مصرح' : 'Access denied'}</p>;
  return <PortalFieldsSettings locale={locale} initial={await loadPortalFields()} />;
}

import React from 'react';
import { redirect } from 'next/navigation';
import { Alert, AlertDescription } from '../../../../components/ui/alert';
import { resolveLocale } from '../../../../i18n/staff-shell';
import { adminApiKeysText } from '../../../../i18n/staff-admin-api-keys';
import { getStaffSessionPrincipal } from '../../../../lib/staff-session-api';
import { loadDataApiKeysAction } from './actions';
import { ApiKeysWorkspace } from '../../../../components/admin-api-keys';

export const dynamic = 'force-dynamic';
type SearchParams = { locale?: string | string[] };

export default async function ApiKeysPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const params = await searchParams;
  const locale = resolveLocale(Array.isArray(params?.locale) ? params?.locale[0] : params?.locale);
  const principal = await getStaffSessionPrincipal();
  if (!principal) redirect(`/?locale=${locale}`);
  if (principal.roleCode !== 'ADMIN' || !principal.permissions.includes('INTEGRATIONS_MANAGE')) {
    return <Alert variant="destructive" dir={locale === 'ar' ? 'rtl' : 'ltr'}><AlertDescription>{adminApiKeysText[locale].forbidden}</AlertDescription></Alert>;
  }
  const initial = await loadDataApiKeysAction();
  return <ApiKeysWorkspace initial={initial} locale={locale} />;
}

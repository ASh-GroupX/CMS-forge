import React, { Suspense } from 'react';
import { CommunicationGroups } from '../../../components/communication-groups';
import { resolveLocale } from '../../../i18n/staff-shell';
import { getStaffCommunicationGroups } from '../../../lib/staff-communication-groups-api';

export default async function CommunicationGroupsPage({ searchParams }: { searchParams?: Promise<{ locale?: string | string[] }> }) {
  const params = await searchParams;
  const locale = resolveLocale(Array.isArray(params?.locale) ? params?.locale[0] : params?.locale);
  return <Suspense fallback={<CommunicationGroups data={null} loadState="loading" locale={locale} />}><CommunicationGroupsData locale={locale} /></Suspense>;
}

async function CommunicationGroupsData({ locale }: { locale: 'ar' | 'en' }) {
  const result = await getStaffCommunicationGroups();
  return <CommunicationGroups data={result.status === 'ready' ? result.data : null} loadState={result.status} locale={locale} />;
}

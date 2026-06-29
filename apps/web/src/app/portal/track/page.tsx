import React from 'react';
import { PortalTrackingScreen } from '../../../components/portal-tracking';
import { resolvePortalTrackingLocale } from '../../../i18n/portal-tracking';

type SearchParams = {
  locale?: string | string[];
  reference?: string | string[];
  state?: string | string[];
};

export default async function PortalTrackingPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const locale = resolvePortalTrackingLocale(params?.locale);
  return <PortalTrackingScreen locale={locale} />;
}

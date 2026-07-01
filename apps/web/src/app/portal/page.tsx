import React from 'react';
import { PortalSubmissionScreen } from '../../components/portal-submission';
import { resolvePortalLocale } from '../../i18n/portal-submission';

type SearchParams = {
  locale?: string | string[];
};

export default async function PortalSubmissionPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const locale = resolvePortalLocale(params?.locale);
  return <PortalSubmissionScreen locale={locale} />;
}

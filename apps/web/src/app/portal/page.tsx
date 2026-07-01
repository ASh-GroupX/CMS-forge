import React from 'react';
import { PortalSubmissionScreen } from '../../components/portal-submission';
import { resolvePortalLocale } from '../../i18n/portal-submission';
import { getPortalSubmissionOptions, type PortalSubmissionOptions } from '../../lib/portal-submission-api';

type SearchParams = {
  locale?: string | string[];
};

export default async function PortalSubmissionPage({
  apiUrl = process.env.API_URL ?? 'http://localhost:3000',
  fetchImpl = fetch,
  searchParams,
}: {
  apiUrl?: string;
  fetchImpl?: typeof fetch;
  searchParams?: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const locale = resolvePortalLocale(params?.locale);
  const options = await getOptions(apiUrl, fetchImpl);
  return <PortalSubmissionScreen locale={locale} options={options} />;
}

async function getOptions(apiUrl: string, fetchImpl: typeof fetch): Promise<PortalSubmissionOptions> {
  const result = await getPortalSubmissionOptions({ apiUrl, fetchImpl });
  return result.ok ? result.data : { branches: [], categories: [], severities: [] };
}

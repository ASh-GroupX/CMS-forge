import React from 'react';
import { PortalSubmissionScreen } from '../../components/portal-submission';
import { PortalShell } from '../../components/portal-shell';
import { portalSubmissionText, resolvePortalLocale } from '../../i18n/portal-submission';
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
  const t = portalSubmissionText[locale];
  const switchLocale = locale === 'ar' ? 'en' : 'ar';
  const options = await getOptions(apiUrl, fetchImpl);
  return (
    <PortalShell
      current="submit"
      locale={locale}
      privacy={t.privacy}
      subtitle={t.subtitle}
      switchHref={`/portal?locale=${switchLocale}`}
      switchLabel={t.switchLabel}
      switchTarget={t.switchTarget}
      title={t.title}
    >
      <PortalSubmissionScreen locale={locale} options={options} />
    </PortalShell>
  );
}

async function getOptions(apiUrl: string, fetchImpl: typeof fetch): Promise<PortalSubmissionOptions | null> {
  const result = await getPortalSubmissionOptions({ apiUrl, fetchImpl });
  return result.ok ? result.data : null;
}

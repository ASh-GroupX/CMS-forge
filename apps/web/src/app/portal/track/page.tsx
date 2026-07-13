import React from 'react';
import { PortalShell } from '../../../components/portal-shell';
import { PortalTrackingScreen } from '../../../components/portal-tracking';
import { portalTrackingText, resolvePortalTrackingLocale } from '../../../i18n/portal-tracking';

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
  const reference = readParam(params?.reference) ?? '';
  const t = portalTrackingText[locale];
  const switchLocale = locale === 'ar' ? 'en' : 'ar';
  const switchHref = `/portal/track?locale=${switchLocale}${reference ? `&reference=${encodeURIComponent(reference)}` : ''}`;
  return (
    <PortalShell
      current="track"
      locale={locale}
      privacy={t.privacy}
      subtitle={t.subtitle}
      switchHref={switchHref}
      switchLabel={t.switchLabel}
      switchTarget={t.switchTarget}
      title={t.title}
    >
      <PortalTrackingScreen initialReference={reference} locale={locale} />
    </PortalShell>
  );
}

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

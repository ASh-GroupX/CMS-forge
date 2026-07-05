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
  const t = portalTrackingText[locale];
  const switchLocale = locale === 'ar' ? 'en' : 'ar';
  return (
    <PortalShell
      current="track"
      locale={locale}
      privacy={t.privacy}
      subtitle={t.subtitle}
      switchHref={`/portal/track?locale=${switchLocale}`}
      switchLabel={t.switchLabel}
      switchTarget={t.switchTarget}
      title={t.title}
    >
      <PortalTrackingScreen locale={locale} />
    </PortalShell>
  );
}

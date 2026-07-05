import React from 'react';
import { PortalShell } from '../../../components/portal-shell';
import { PortalSurveyScreen, type PortalSurveyFixtureState } from '../../../components/portal-survey';
import { portalSurveyText, resolvePortalSurveyLocale } from '../../../i18n/portal-survey';

type SearchParams = {
  key?: string | string[];
  locale?: string | string[];
  state?: string | string[];
  token?: string | string[];
};

export default async function PortalSurveyPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const locale = resolvePortalSurveyLocale(params?.locale);
  const surveyKey = readParam(params?.key) ?? readParam(params?.token);
  const t = portalSurveyText[locale];
  const switchLocale = locale === 'ar' ? 'en' : 'ar';
  const switchHref = surveyKey ? `/portal/survey?locale=${switchLocale}&key=${encodeURIComponent(surveyKey)}` : `/portal/survey?locale=${switchLocale}`;
  return (
    <PortalShell
      current="survey"
      locale={locale}
      privacy={t.privacy}
      subtitle={t.subtitle}
      switchHref={switchHref}
      switchLabel={t.switchLabel}
      switchTarget={t.switchTarget}
      title={t.title}
    >
      <PortalSurveyScreen locale={locale} state={previewState(readParam(params?.state))} surveyKey={surveyKey} />
    </PortalShell>
  );
}

function readParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function previewState(value: string | undefined): PortalSurveyFixtureState | undefined {
  return value === 'success' || value === 'used' || value === 'expired' || value === 'validation' || value === 'loading' || value === 'error' || value === 'missing' ? value : undefined;
}

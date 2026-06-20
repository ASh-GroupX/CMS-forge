import React from 'react';
import { PortalSurveyScreen, type PortalSurveyPreviewState } from '../../../components/portal-survey';
import { resolvePortalSurveyLocale } from '../../../i18n/portal-survey';

type SearchParams = {
  locale?: string | string[];
  state?: string | string[];
};

export default async function PortalSurveyPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const locale = resolvePortalSurveyLocale(params?.locale);
  return <PortalSurveyScreen locale={locale} state={previewState(readParam(params?.state))} />;
}

function readParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function previewState(value: string | undefined): PortalSurveyPreviewState | undefined {
  return value === 'success' || value === 'used' || value === 'expired' || value === 'validation' || value === 'loading' || value === 'error' ? value : undefined;
}

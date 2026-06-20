import React from 'react';
import { PortalTrackingScreen, type PortalTrackingPreviewState } from '../../../components/portal-tracking';
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
  const state = previewState(readParam(params?.state));
  const reference = readParam(params?.reference) || portalTrackingText[locale].sample.reference;
  return <PortalTrackingScreen locale={locale} reference={reference} state={state} />;
}

function readParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function previewState(value: string | undefined): PortalTrackingPreviewState | undefined {
  return value === 'loading' || value === 'requested' || value === 'verified' || value === 'validation' || value === 'invalid' || value === 'expired' || value === 'error' || value === 'followup' ? value : undefined;
}

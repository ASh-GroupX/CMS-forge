import React from 'react';
import { PortalSubmissionScreen, type PortalSubmissionPreviewState } from '../../components/portal-submission';
import { resolvePortalLocale } from '../../i18n/portal-submission';

type SearchParams = {
  locale?: string | string[];
  reference?: string | string[];
  state?: string | string[];
};

export default async function PortalSubmissionPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const locale = resolvePortalLocale(params?.locale);
  const state = previewState(readParam(params?.state));
  const reference = readParam(params?.reference) || 'CMP-2026-018';
  return <PortalSubmissionScreen locale={locale} reference={reference} state={state} />;
}

function readParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function previewState(value: string | undefined): PortalSubmissionPreviewState | undefined {
  return value === 'loading' || value === 'validation' || value === 'success' || value === 'error' ? value : undefined;
}

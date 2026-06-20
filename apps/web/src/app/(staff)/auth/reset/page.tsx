import React from 'react';
import { PasswordReset, type ResetPreviewState } from '../../../../components/password-reset';
import { resolveLocale } from '../../../../i18n/staff-shell';

type SearchParams = { locale?: string | string[]; reset?: string | string[] };

export default async function PasswordResetPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const params = await searchParams;
  return <PasswordReset locale={resolveLocale(readParam(params?.locale))} state={resolveReset(readParam(params?.reset))} />;
}

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function resolveReset(value: string | undefined): ResetPreviewState | undefined {
  return value === 'request' || value === 'requested' || value === 'token' || value === 'success' || value === 'invalid'
    ? value
    : undefined;
}

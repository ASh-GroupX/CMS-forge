import React from 'react';
import { AdminSurfaces, type AdminPreviewState } from '../../../components/admin-surfaces';
import { resolveLocale } from '../../../i18n/staff-shell';

type SearchParams = { admin?: string | string[]; locale?: string | string[] };

export default async function AdminPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const params = await searchParams;
  return <AdminSurfaces locale={resolveLocale(readParam(params?.locale))} state={resolveState(readParam(params?.admin))} />;
}

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function resolveState(value: string | undefined): AdminPreviewState | undefined {
  return value === 'loading' || value === 'empty' || value === 'error' || value === 'success' || value === 'validation' || value === 'conflict'
    ? value
    : undefined;
}

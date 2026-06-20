import React from 'react';
import { AdminUsersRoles, type AdminUsersPreviewState } from '../../../../components/admin-users-roles';
import { resolveLocale } from '../../../../i18n/staff-shell';

type SearchParams = { admin?: string | string[]; locale?: string | string[] };

export default async function AdminUsersPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const params = await searchParams;
  return <AdminUsersRoles locale={resolveLocale(readParam(params?.locale))} state={resolveState(readParam(params?.admin))} />;
}

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function resolveState(value: string | undefined): AdminUsersPreviewState | undefined {
  return value === 'loading' || value === 'empty' || value === 'error' || value === 'success' || value === 'validation' || value === 'conflict'
    ? value
    : undefined;
}

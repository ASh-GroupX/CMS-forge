import React from 'react';
import { AdminUsersRoles, type AdminUsersPreviewState } from '../../../components/admin-users-roles';
import { resolveLocale } from '../../../i18n/staff-shell';
import { getAdminUsers } from '../../../lib/staff-admin-users-api';
import { createAdminUserAction, toggleAdminUserAction } from './users/actions';

type SearchParams = { admin?: string | string[]; locale?: string | string[] };

export default async function AdminPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const params = await searchParams;
  const data = await getAdminUsers();
  return (
    <AdminUsersRoles
      createAction={createAdminUserAction}
      data={data}
      locale={resolveLocale(readParam(params?.locale))}
      state={data ? resolveState(readParam(params?.admin)) : 'error'}
      toggleAction={toggleAdminUserAction}
    />
  );
}

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function resolveState(value: string | undefined): AdminUsersPreviewState | undefined {
  return value === 'loading' || value === 'empty' || value === 'error' || value === 'success' || value === 'validation' || value === 'conflict'
    ? value
    : undefined;
}

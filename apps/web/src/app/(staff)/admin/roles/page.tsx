import React from 'react';
import { AdminRoles } from '../../../../components/admin-roles';
import { resolveLocale } from '../../../../i18n/staff-shell';
import { getAdminRoles } from '../../../../lib/staff-admin-roles-api';
import { createAdminRoleAction } from './actions';

type SearchParams = { locale?: string | string[]; role?: string | string[] };
export default async function AdminRolesPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const params = await searchParams;
  const value = Array.isArray(params?.role) ? params?.role[0] : params?.role;
  const state = value === 'success' || value === 'validation' || value === 'error' ? value : undefined;
  const locale = resolveLocale(Array.isArray(params?.locale) ? params?.locale[0] : params?.locale);
  return <AdminRoles action={createAdminRoleAction} data={await getAdminRoles()} locale={locale} state={state} />;
}

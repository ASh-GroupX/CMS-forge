import React from 'react';
import { AdminMasterDataOverview } from '../../../components/admin-master-data';
import { AdminUsersRoles, type AdminUsersPreviewState } from '../../../components/admin-users-roles';
import { resolveLocale } from '../../../i18n/staff-shell';
import { getAdminUsers } from '../../../lib/staff-admin-users-api';
import { getComplaintFormOptions } from '../../../lib/staff-complaint-form-options-api';
import { saveBranchAction, saveCategoryAction } from './actions';
import { createAdminUserAction, toggleAdminUserAction } from './users/actions';

type SearchParams = { admin?: string | string[]; locale?: string | string[] };

export default async function AdminPage({
  cookieHeader,
  fetchImpl,
  searchParams,
}: {
  cookieHeader?: string;
  fetchImpl?: typeof fetch;
  searchParams?: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const requestOptions = {
    ...(cookieHeader ? { cookieHeader } : {}),
    ...(fetchImpl ? { fetchImpl } : {}),
  };
  const [data, intakeOptions] = await Promise.all([
    getAdminUsers(requestOptions),
    getComplaintFormOptions(requestOptions),
  ]);
  const locale = resolveLocale(readParam(params?.locale));
  return (
    <div className="grid gap-4">
      <AdminUsersRoles
        createAction={createAdminUserAction}
        data={data}
        locale={locale}
        state={data ? resolveState(readParam(params?.admin)) : 'error'}
        toggleAction={toggleAdminUserAction}
      />
      <AdminMasterDataOverview branchAction={saveBranchAction} categoryAction={saveCategoryAction} locale={locale} options={intakeOptions} />
    </div>
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

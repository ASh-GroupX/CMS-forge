import React from 'react';
import { AdminMasterDataOverview } from '../../../../components/admin-master-data';
import { resolveLocale } from '../../../../i18n/staff-shell';
import { getComplaintFormOptions } from '../../../../lib/staff-complaint-form-options-api';
import { saveBranchAction, saveCategoryAction } from '../actions';

type SearchParams = { locale?: string | string[] };

export default async function AdminBranchesPage({
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
    ...(cookieHeader !== undefined ? { cookieHeader } : {}),
    ...(fetchImpl !== undefined ? { fetchImpl } : {}),
  };
  const options = await getComplaintFormOptions(requestOptions);
  return <AdminMasterDataOverview branchAction={saveBranchAction} categoryAction={saveCategoryAction} locale={resolveLocale(readParam(params?.locale))} options={options} />;
}

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

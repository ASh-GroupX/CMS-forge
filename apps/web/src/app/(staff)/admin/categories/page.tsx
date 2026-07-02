import React from 'react';
import { AdminCategoriesSla, type AdminConfigPreviewState } from '../../../../components/admin-categories-sla';
import { resolveLocale } from '../../../../i18n/staff-shell';
import { getAdminCategorySlaConfig } from '../../../../lib/staff-admin-category-sla-api';
import { deactivateCategoryAction, saveCategoryAction, saveSlaPolicyAction } from '../actions';

type SearchParams = { admin?: string | string[]; locale?: string | string[] };

export default async function AdminCategoriesPage({
  cookieHeader,
  fetchImpl,
  searchParams,
}: {
  cookieHeader?: string;
  fetchImpl?: typeof fetch;
  searchParams?: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const config = await getAdminCategorySlaConfig({
    ...(cookieHeader ? { cookieHeader } : {}),
    ...(fetchImpl ? { fetchImpl } : {}),
  });
  return (
    <AdminCategoriesSla
      categoryAction={saveCategoryAction}
      config={config}
      deactivateCategoryAction={deactivateCategoryAction}
      locale={resolveLocale(readParam(params?.locale))}
      slaAction={saveSlaPolicyAction}
      state={resolveState(readParam(params?.admin)) ?? (config ? undefined : 'error')}
    />
  );
}

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function resolveState(value: string | undefined): AdminConfigPreviewState | undefined {
  return value === 'loading' || value === 'empty' || value === 'error' || value === 'success' || value === 'validation' || value === 'conflict'
    ? value
    : undefined;
}

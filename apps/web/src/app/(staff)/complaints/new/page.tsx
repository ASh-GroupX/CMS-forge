import React from 'react';
import { type CreateFormPreviewState } from '../../../../components/complaint-create-form';
import { ComplaintIntakeWorkspace } from '../../../../components/complaint-intake-workspace';
import { type LookupPreviewState } from '../../../../components/customer-vehicle-lookup';
import { resolveLocale } from '../../../../i18n/staff-shell';
import { getComplaintFormOptions } from '../../../../lib/staff-complaint-form-options-api';

type SearchParams = {
  create?: string | string[];
  locale?: string | string[];
  lookup?: string | string[];
};

export default async function NewComplaintPage({
  cookieHeader,
  fetchImpl,
  searchParams,
}: {
  cookieHeader?: string;
  fetchImpl?: typeof fetch;
  searchParams?: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const locale = resolveLocale(readParam(params?.locale));
  const options = await getComplaintFormOptions({
    ...(cookieHeader !== undefined ? { cookieHeader } : {}),
    ...(fetchImpl !== undefined ? { fetchImpl } : {}),
  });
  return (
    <main className="grid gap-4">
      <ComplaintIntakeWorkspace createState={resolveCreate(readParam(params?.create))} locale={locale} lookupState={resolveLookup(readParam(params?.lookup))} options={options} />
    </main>
  );
}

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function resolveLookup(value: string | undefined): LookupPreviewState | undefined {
  return value === 'loading' || value === 'none' || value === 'error' || value === 'match' || value === 'multiple' || value === 'down' || value === 'disabled' || value === 'validation' || value === 'manual' ? value : undefined;
}

function resolveCreate(value: string | undefined): CreateFormPreviewState | undefined {
  return value === 'validation' || value === 'success' || value === 'error' || value === 'loading' || value === 'network'
    ? value
    : undefined;
}

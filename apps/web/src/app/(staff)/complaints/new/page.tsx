import React from 'react';
import { AttachmentUploadPanel, type AttachmentPreviewState } from '../../../../components/attachment-upload-panel';
import { ComplaintCreateForm, type CreateFormPreviewState } from '../../../../components/complaint-create-form';
import { CustomerVehicleLookup, type LookupPreviewState } from '../../../../components/customer-vehicle-lookup';
import { resolveLocale } from '../../../../i18n/staff-shell';
import { getComplaintFormOptions } from '../../../../lib/staff-complaint-form-options-api';

type SearchParams = {
  attachment?: string | string[];
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
      <CustomerVehicleLookup locale={locale} state={resolveLookup(readParam(params?.lookup))} />
      <ComplaintCreateForm locale={locale} options={options} state={resolveCreate(readParam(params?.create))} />
      <AttachmentUploadPanel locale={locale} state={resolveAttachment(readParam(params?.attachment))} />
    </main>
  );
}

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function resolveLookup(value: string | undefined): LookupPreviewState | undefined {
  return value === 'loading' || value === 'none' || value === 'error' ? value : undefined;
}

function resolveCreate(value: string | undefined): CreateFormPreviewState | undefined {
  return value === 'validation' || value === 'success' || value === 'error' || value === 'loading' || value === 'network'
    ? value
    : undefined;
}

function resolveAttachment(value: string | undefined): AttachmentPreviewState | undefined {
  return value === 'loading' || value === 'empty' || value === 'error' || value === 'pending' || value === 'clean' || value === 'rejected'
    ? value
    : undefined;
}

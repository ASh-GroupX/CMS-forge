import React from 'react';
import {
  ComplaintDetailWorkspace,
  type ComplaintAttachmentPreviewState,
  type ComplaintCommentsPreviewState,
  type ComplaintDetailPreviewState,
  type ComplaintWorkflowPreviewState,
} from '../../../../components/complaint-detail-workspace';
import { resolveLocale } from '../../../../i18n/staff-shell';
import { getStaffComplaintDetail } from '../../../../lib/staff-detail-api';

type RouteParams = { id?: string | string[] };
type SearchParams = {
  attachment?: string | string[];
  comments?: string | string[];
  detail?: string | string[];
  locale?: string | string[];
  workflow?: string | string[];
};

export default async function ComplaintDetailPage({
  cookieHeader,
  fetchImpl,
  params,
  searchParams,
}: {
  cookieHeader?: string;
  fetchImpl?: typeof fetch;
  params?: Promise<RouteParams>;
  searchParams?: Promise<SearchParams>;
}) {
  const [routeParams, query] = await Promise.all([params, searchParams]);
  const id = readParam(routeParams?.id);
  const apiInput = {
    ...(cookieHeader !== undefined ? { cookieHeader } : {}),
    ...(fetchImpl !== undefined ? { fetchImpl } : {}),
    ...(id !== undefined ? { complaintId: id } : {}),
  };
  const detail = await getStaffComplaintDetail(apiInput);

  return (
    <ComplaintDetailWorkspace
      attachmentState={resolveAttachment(readParam(query?.attachment))}
      commentsState={resolveDetail(readParam(query?.comments))}
      detail={detail ?? undefined}
      locale={resolveLocale(readParam(query?.locale))}
      state={resolveDetail(readParam(query?.detail))}
      workflowState={resolveWorkflow(readParam(query?.workflow))}
    />
  );
}

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function resolveDetail(value: string | undefined): ComplaintDetailPreviewState | undefined {
  return value === 'loading' || value === 'empty' || value === 'error' ? value : undefined;
}

function resolveAttachment(value: string | undefined): ComplaintAttachmentPreviewState | undefined {
  return value === 'loading' || value === 'empty' || value === 'error' || value === 'pending' || value === 'clean' || value === 'rejected'
    ? value
    : undefined;
}

function resolveWorkflow(value: string | undefined): ComplaintWorkflowPreviewState | undefined {
  return value === 'loading' || value === 'empty' || value === 'error' || value === 'success' || value === 'conflict' || value === 'validation'
    ? value
    : undefined;
}

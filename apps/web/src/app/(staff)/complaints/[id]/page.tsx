import React from 'react';
import {
  ComplaintDetailWorkspace,
  type ComplaintAttachmentPreviewState,
  type ComplaintCommentsPreviewState,
  type ComplaintDetailPreviewState,
  type ComplaintWorkflowPreviewState,
} from '../../../../components/complaint-detail-workspace';
import type { LookupPreviewState } from '../../../../components/customer-vehicle-lookup';
import { resolveLocale } from '../../../../i18n/staff-shell';
import { getAssignableStaff } from '../../../../lib/staff-assignable-staff-api';
import { getComplaintFormOptions } from '../../../../lib/staff-complaint-form-options-api';
import { getStaffComplaintComments } from '../../../../lib/staff-complaint-comments-api';
import { getStaffComplaintRelationsView } from '../../../../lib/staff-complaint-relations-api';
import { getStaffComplaintSurveys } from '../../../../lib/staff-complaint-surveys-api';
import { getStaffComplaintDetail } from '../../../../lib/staff-detail-api';

type RouteParams = { id?: string | string[] };
type SearchParams = {
  attachment?: string | string[];
  comments?: string | string[];
  detail?: string | string[];
  locale?: string | string[];
  lookup?: string | string[];
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
  const [detail, comments, relations, surveys, staff, options] = await Promise.all([
    getStaffComplaintDetail(apiInput),
    getStaffComplaintComments(apiInput),
    getStaffComplaintRelationsView(apiInput),
    getStaffComplaintSurveys(apiInput),
    getAssignableStaff({ ...(cookieHeader !== undefined ? { cookieHeader } : {}), ...(fetchImpl !== undefined ? { fetchImpl } : {}) }),
    getComplaintFormOptions({ ...(cookieHeader !== undefined ? { cookieHeader } : {}), ...(fetchImpl !== undefined ? { fetchImpl } : {}) }),
  ]);
  const detailState = resolveDetail(readParam(query?.detail)) ?? (id && !detail ? 'error' : undefined);
  const commentsState = resolveDetail(readParam(query?.comments)) ?? (detail && comments === null ? 'error' : undefined);

  return (
    <ComplaintDetailWorkspace
      attachmentState={resolveAttachment(readParam(query?.attachment))}
      comments={comments}
      commentsState={commentsState}
      detail={detail ?? undefined}
      locale={resolveLocale(readParam(query?.locale))}
      lookupState={resolveLookup(readParam(query?.lookup))}
      options={options}
      relations={relations ?? undefined}
      staff={staff}
      state={detailState}
      surveys={surveys}
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

function resolveLookup(value: string | undefined): LookupPreviewState | undefined {
  return value === 'loading' || value === 'none' || value === 'error' || value === 'match' || value === 'multiple' || value === 'down' || value === 'disabled' || value === 'validation' || value === 'manual'
    ? value
    : undefined;
}

import React from 'react';
import { ComplaintWorkspace } from '../../../../components/complaint-workspace';
import { resolveLocale } from '../../../../i18n/staff-shell';
import { getAssignableStaff } from '../../../../lib/staff-assignable-staff-api';
import { getStaffAssignmentOptions } from '../../../../lib/staff-assignment-options-api';
import { getComplaintFormOptions } from '../../../../lib/staff-complaint-form-options-api';
import { getStaffComplaintComments } from '../../../../lib/staff-complaint-comments-api';
import { getStaffComplaintRelationsView } from '../../../../lib/staff-complaint-relations-api';
import { getStaffComplaintSurveys } from '../../../../lib/staff-complaint-surveys-api';
import { fetchComplaintTimeline } from '../../../../lib/staff-complaint-timeline-api';
import { getStaffComplaintDetailLoadResult } from '../../../../lib/staff-detail-api';

type RouteParams = { id?: string | string[] };
type SearchParams = {
  locale?: string | string[];
  tab?: string | string[];
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
  
  let resolvedCookieHeader = cookieHeader;
  if (resolvedCookieHeader === undefined) {
    try {
      const { headers } = await import('next/headers');
      resolvedCookieHeader = (await headers()).get('cookie') ?? '';
    } catch {
      resolvedCookieHeader = '';
    }
  }

  const apiInput = {
    ...(resolvedCookieHeader !== '' ? { cookieHeader: resolvedCookieHeader } : {}),
    ...(fetchImpl !== undefined ? { fetchImpl } : {}),
    ...(id !== undefined ? { complaintId: id } : {}),
  };
  const detailResult = await getStaffComplaintDetailLoadResult(apiInput);
  const detail = detailResult.status === 'ready' ? detailResult.data : null;
  const [staff, options, assignmentOptions] = detail ? await Promise.all([
    getAssignableStaff({ ...(resolvedCookieHeader !== '' ? { cookieHeader: resolvedCookieHeader } : {}), ...(fetchImpl !== undefined ? { fetchImpl } : {}) }),
    getComplaintFormOptions({ ...(resolvedCookieHeader !== '' ? { cookieHeader: resolvedCookieHeader } : {}), ...(fetchImpl !== undefined ? { fetchImpl } : {}) }),
    getStaffAssignmentOptions({ ...(resolvedCookieHeader !== '' ? { cookieHeader: resolvedCookieHeader } : {}), ...(fetchImpl !== undefined ? { fetchImpl } : {}) }),
  ]) : [null, null, null] as const;
  const detailState = detailResult.status === 'ready' ? 'ready' : detailResult.status;

  return (
    <ComplaintWorkspace
      assignmentOptions={assignmentOptions}
      detail={detail ?? undefined}
      locale={resolveLocale(readParam(query?.locale))}
      options={options}
      staff={staff}
      state={detailState}
      timeline={detail?.communicationTimeline}
    />
  );
}

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function tabParam(value: string | undefined): 'work' | 'communication' | 'details' {
  return value === 'communication' || value === 'details' ? value : 'work';
}

import React from 'react';
import {
  ComplaintDetailWorkspace,
} from '../../../../components/complaint-detail-workspace';
import { resolveLocale } from '../../../../i18n/staff-shell';
import { getAssignableStaff } from '../../../../lib/staff-assignable-staff-api';
import { getComplaintFormOptions } from '../../../../lib/staff-complaint-form-options-api';
import { getStaffComplaintComments } from '../../../../lib/staff-complaint-comments-api';
import { getStaffComplaintRelationsView } from '../../../../lib/staff-complaint-relations-api';
import { getStaffComplaintSurveys } from '../../../../lib/staff-complaint-surveys-api';
import { getStaffComplaintDetailLoadResult } from '../../../../lib/staff-detail-api';

type RouteParams = { id?: string | string[] };
type SearchParams = {
  locale?: string | string[];
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
  const detailResult = await getStaffComplaintDetailLoadResult(apiInput);
  const detail = detailResult.status === 'ready' ? detailResult.data : null;
  const [comments, relations, surveys, staff, options] = detail ? await Promise.all([
    getStaffComplaintComments(apiInput),
    getStaffComplaintRelationsView(apiInput),
    getStaffComplaintSurveys(apiInput),
    getAssignableStaff({ ...(cookieHeader !== undefined ? { cookieHeader } : {}), ...(fetchImpl !== undefined ? { fetchImpl } : {}) }),
    getComplaintFormOptions({ ...(cookieHeader !== undefined ? { cookieHeader } : {}), ...(fetchImpl !== undefined ? { fetchImpl } : {}) }),
  ]) : [null, null, null, null, null] as const;
  const detailState = detailResult.status === 'ready' ? undefined : detailResult.status;
  const commentsState = detail && comments === null ? 'error' : undefined;

  return (
    <ComplaintDetailWorkspace
      comments={comments}
      commentsState={commentsState}
      detail={detail ?? undefined}
      locale={resolveLocale(readParam(query?.locale))}
      options={options}
      relations={relations ?? undefined}
      staff={staff}
      state={detailState}
      surveys={surveys}
    />
  );
}

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

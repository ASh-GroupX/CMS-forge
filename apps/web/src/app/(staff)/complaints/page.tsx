import React from 'react';
import { resolveLocale } from '../../../i18n/staff-shell';
import { getComplaintFormOptions } from '../../../lib/staff-complaint-form-options-api';
import { getStaffQueueLoadResult, type StaffQueueQuery } from '../../../lib/staff-queue-api';
import { WorkQueue } from '../../../components/work-queue';
import type { ComplaintSeverity, ComplaintStatus } from '../../../lib/staff-complaints-api';

type SearchParams = { branchId?: string | string[]; locale?: string | string[]; ownerScope?: string | string[]; page?: string | string[]; search?: string | string[]; severity?: string | string[]; sla?: string | string[]; status?: string | string[] };

export default async function ComplaintsPage({
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
  const query = queueQuery(params);
  const requestOptions = {
    ...(cookieHeader !== undefined ? { cookieHeader } : {}),
    ...(fetchImpl !== undefined ? { fetchImpl } : {}),
  };
  const apiInput = {
    ...requestOptions,
    query,
  };
  const [queue, options] = await Promise.all([getStaffQueueLoadResult(apiInput), getComplaintFormOptions(requestOptions)]);
  return <WorkQueue locale={locale} options={options} query={query} queue={queue.status === 'ready' ? queue.data : null} state={queue.status === 'ready' ? undefined : queue.status} />;
}

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function queueQuery(params: SearchParams | undefined): StaffQueueQuery {
  return {
    branchId: clean(readParam(params?.branchId)),
    page: positiveInt(readParam(params?.page)),
    search: clean(readParam(params?.search)),
    severity: severity(readParam(params?.severity)),
    sla: sla(readParam(params?.sla)),
    status: status(readParam(params?.status)),
    ownerScope: ownerScope(readParam(params?.ownerScope)),
  };
}

function clean(value: string | undefined): string | null {
  const text = value?.trim();
  return text && text !== 'all' ? text : null;
}

function positiveInt(value: string | undefined): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function status(value: string | undefined): ComplaintStatus | null {
  return ['DRAFT', 'SUBMITTED', 'MANAGER_REVIEW', 'BRANCH_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REOPENED', 'REJECTED'].includes(value ?? '') ? value as ComplaintStatus : null;
}

function severity(value: string | undefined): ComplaintSeverity | null {
  return ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(value ?? '') ? value as ComplaintSeverity : null;
}

function sla(value: string | undefined): NonNullable<StaffQueueQuery['sla']> | null {
  return value === 'ON_TRACK' || value === 'WARNING' || value === 'BREACHED' || value === 'CLOSED' ? value : null;
}

function ownerScope(value: string | undefined): NonNullable<StaffQueueQuery['ownerScope']> | null { return value === 'ME' || value === 'UNASSIGNED' ? value : null; }

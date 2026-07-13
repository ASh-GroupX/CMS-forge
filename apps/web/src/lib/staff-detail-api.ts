import type { CaseCapaAction, DetailTimelineItem } from './staff-case-sidecar-api';
import { fetchCaseCapa, fetchCaseTimeline } from './staff-case-sidecar-api';
import type { ComplaintTimelineItem } from './staff-complaint-timeline-api';
import { fetchComplaintTimeline } from './staff-complaint-timeline-api';
import type { ComplaintDetail } from './staff-complaints-api';
type DetailResponse = { complaint?: Partial<ComplaintDetail> };
const STAFF_SESSION_COOKIE = 'cms_staff_session';

export type StaffComplaintDetailView = {
  assignee: string | null;
  branch: string;
  displayTimeZone: string;
  categoryId: string;
  categoryName: string;
  categoryNameAr: string;
  case: {
    id: string;
    type: string;
    status: string;
    lifecycleStatus: string;
    branchName: string;
    ownerId: string | null;
    ownerName: string | null;
  } | null;
  capaActions: CaseCapaAction[];
  caseTimeline: DetailTimelineItem[];
  communicationTimeline: ComplaintTimelineItem[];
  customer: ComplaintDetail['customer'];
  id: string;
  updatedAt: string;
  reference: string;
  severity: string;
  slaDueAt: string | null;
  slaPercentElapsed: number | null;
  slaState: ComplaintDetail['slaState'];
  status: string;
  subject: string;
  nextAction: string | null;
  customerSource: ComplaintDetail['customerSource'];
  manualCustomer: boolean;
  vehicleRelated: boolean;
  vehicle: ComplaintDetail['vehicle'];
  vehicleSource: ComplaintDetail['vehicleSource'];
  manualVehicle: boolean;
  vehicleDataUnavailableReason: string | null;
  allowedActions: ComplaintDetail['allowedActions'];
  timeline: DetailTimelineItem[];
};

export type StaffComplaintDetailLoadResult =
  | { status: 'ready'; data: StaffComplaintDetailView }
  | { status: 'denied' | 'empty' | 'error' | 'notFound' };

export async function getStaffComplaintDetail({
  apiUrl = process.env.API_URL ?? 'http://localhost:3000',
  complaintId,
  cookieHeader,
  fetchImpl = fetch,
}: {
  apiUrl?: string;
  complaintId?: string;
  cookieHeader?: string;
  fetchImpl?: typeof fetch;
} = {}): Promise<StaffComplaintDetailView | null> {
  const result = await getStaffComplaintDetailLoadResult({ apiUrl, ...(complaintId !== undefined ? { complaintId } : {}), ...(cookieHeader !== undefined ? { cookieHeader } : {}), fetchImpl });
  return result.status === 'ready' ? result.data : null;
}

export async function getStaffComplaintDetailLoadResult({
  apiUrl = process.env.API_URL ?? 'http://localhost:3000',
  complaintId,
  cookieHeader,
  fetchImpl = fetch,
}: {
  apiUrl?: string;
  complaintId?: string;
  cookieHeader?: string;
  fetchImpl?: typeof fetch;
} = {}): Promise<StaffComplaintDetailLoadResult> {
  const id = complaintId?.trim();
  if (!id) return { status: 'empty' };
  const cookies = cookieHeader ?? await incomingCookieHeader();
  if (!hasStaffSessionCookie(cookies)) return { status: 'denied' };

  try {
    const response = await fetchImpl(new URL(`/complaints/${encodeURIComponent(id)}`, apiUrl), {
      cache: 'no-store',
      headers: { Accept: 'application/json', cookie: cookies },
    });
    if (response.status === 401 || response.status === 403) return { status: 'denied' };
    if (response.status === 404) return { status: 'notFound' };
    if (!response.ok) return { status: 'error' };
    const detail = detailFrom((await response.json()) as DetailResponse);
    if (!detail) return { status: 'error' };
    const [communicationTimeline, caseTimeline, capaActions] = await Promise.all([
      fetchComplaintTimeline({ apiUrl, complaintId: detail.id, cookies, fetchImpl }),
      detail.caseSummary ? fetchCaseTimeline({ apiUrl, caseId: detail.caseSummary.id, cookies, fetchImpl }) : Promise.resolve([]),
      detail.caseSummary ? fetchCaseCapa({ apiUrl, caseId: detail.caseSummary.id, cookies, fetchImpl }) : Promise.resolve([]),
    ]);
    return { status: 'ready', data: viewFromDetail(detail, caseTimeline, capaActions, communicationTimeline) };
  } catch {
    return { status: 'error' };
  }
}

function viewFromDetail(detail: ComplaintDetail, caseTimeline: DetailTimelineItem[], capaActions: CaseCapaAction[], communicationTimeline: ComplaintTimelineItem[]): StaffComplaintDetailView {
  return {
    assignee: detail.ownerName ?? null,
    branch: detail.branchName ?? '',
    displayTimeZone: detail.displayTimeZone,
    categoryId: detail.categoryId,
    categoryName: detail.categoryName,
    categoryNameAr: detail.categoryNameAr,
    case: detail.caseSummary ? {
      id: detail.caseSummary.id,
      type: detail.caseSummary.type,
      status: detail.caseSummary.status,
      lifecycleStatus: detail.caseSummary.lifecycleStatus,
      branchName: detail.caseSummary.branchName,
      ownerId: detail.caseSummary.ownerId,
      ownerName: detail.caseSummary.ownerName,
    } : null,
    capaActions,
    caseTimeline,
    communicationTimeline,
    customer: detail.customer,
    id: detail.id,
    updatedAt: detail.updatedAt,
    reference: detail.referenceNumber,
    severity: detail.severity,
    slaDueAt: detail.slaDueAt,
    slaPercentElapsed: detail.slaPercentElapsed,
    slaState: detail.slaState,
    status: detail.status,
    subject: detail.subject,
    nextAction: detail.nextAction,
    customerSource: detail.customerSource,
    manualCustomer: detail.manualCustomer,
    vehicleRelated: detail.vehicleRelated,
    vehicle: detail.vehicle,
    vehicleSource: detail.vehicleSource,
    manualVehicle: detail.manualVehicle,
    vehicleDataUnavailableReason: detail.vehicleDataUnavailableReason,
    allowedActions: detail.allowedActions,
    timeline: detail.statusHistory.map((item) => ({ at: item.createdAt, label: item.toStatus })),
  };
}

function detailFrom(body: DetailResponse): ComplaintDetail | null {
  const complaint = body.complaint;
  const customer = customerDetail(complaint?.customer);
  if (
    typeof complaint?.id !== 'string' ||
    typeof complaint.referenceNumber !== 'string' ||
    typeof complaint.status !== 'string' ||
    typeof complaint.severity !== 'string' ||
    typeof complaint.subject !== 'string' ||
    typeof complaint.branchId !== 'string' ||
    typeof complaint.displayTimeZone !== 'string' ||
    typeof complaint.createdAt !== 'string' ||
    typeof complaint.updatedAt !== 'string' ||
    typeof complaint.description !== 'string' ||
    typeof complaint.categoryId !== 'string' ||
    typeof complaint.categoryName !== 'string' ||
    typeof complaint.categoryNameAr !== 'string' ||
    !customer ||
    !Array.isArray(complaint.statusHistory)
  ) {
    return null;
  }

  const vehicle = vehicleDetail(complaint.vehicle);

  return {
    id: complaint.id,
    referenceNumber: complaint.referenceNumber,
    status: complaint.status,
    severity: complaint.severity,
    subject: complaint.subject,
    branchId: complaint.branchId,
    displayTimeZone: complaint.displayTimeZone,
    ownerId: typeof complaint.ownerId === 'string' ? complaint.ownerId : null,
    ownerName: typeof complaint.ownerName === 'string' ? complaint.ownerName : null,
    slaState: complaint.slaState === 'WARNING' || complaint.slaState === 'BREACHED' || complaint.slaState === 'CLOSED' ? complaint.slaState : 'ON_TRACK',
    slaDueAt: typeof complaint.slaDueAt === 'string' ? complaint.slaDueAt : null,
    slaStage: typeof complaint.slaStage === 'string' ? complaint.slaStage : null,
    slaPercentElapsed: typeof complaint.slaPercentElapsed === 'number' ? complaint.slaPercentElapsed : null,
    nextAction: typeof complaint.nextAction === 'string' ? complaint.nextAction : null,
    createdAt: complaint.createdAt,
    updatedAt: complaint.updatedAt,
    description: complaint.description,
    categoryId: complaint.categoryId,
    categoryName: complaint.categoryName,
    categoryNameAr: complaint.categoryNameAr,
    incidentAt: typeof complaint.incidentAt === 'string' ? complaint.incidentAt : null,
    customer,
    vehicle,
    customerSource: dataSource(complaint.customerSource) ?? 'LOCAL',
    manualCustomer: complaint.manualCustomer === true,
    vehicleRelated: complaint.vehicleRelated === true,
    vehicleSource: dataSource(complaint.vehicleSource),
    manualVehicle: complaint.manualVehicle === true,
    vehicleDataUnavailableReason: typeof complaint.vehicleDataUnavailableReason === 'string' ? complaint.vehicleDataUnavailableReason : null,
    statusHistory: complaint.statusHistory.filter(statusHistoryItem),
    caseSummary: caseSummary(complaint.caseSummary),
    allowedActions: Array.isArray(complaint.allowedActions) ? complaint.allowedActions.filter(transitionAction) : [],
  };
}

function customerDetail(value: unknown): ComplaintDetail['customer'] | null {
  const item = value as Partial<ComplaintDetail['customer']>;
  const source = dataSource(item?.source);
  if (typeof item?.id !== 'string' || typeof item.name !== 'string' || !source) return null;
  return { id: item.id, name: item.name, phone: typeof item.phone === 'string' ? item.phone : null, identifier: typeof item.identifier === 'string' ? item.identifier : null, source };
}

function vehicleDetail(value: unknown): ComplaintDetail['vehicle'] {
  if (value === null || value === undefined) return null;
  const item = value as Partial<NonNullable<ComplaintDetail['vehicle']>>;
  const source = dataSource(item?.source);
  if (typeof item?.id !== 'string' || typeof item.vin !== 'string' || typeof item.plate !== 'string' || typeof item.make !== 'string' || typeof item.model !== 'string' || typeof item.year !== 'number' || !source) return null;
  return { id: item.id, vin: item.vin, plate: item.plate, make: item.make, model: item.model, year: item.year, source };
}

function transitionAction(value: unknown): value is ComplaintDetail['allowedActions'][number] {
  return typeof value === 'string';
}

function dataSource(value: unknown): ComplaintDetail['customerSource'] | null {
  return value === 'LOCAL' || value === 'MANUAL' || value === 'DMS' ? value : null;
}

function caseSummary(value: unknown): ComplaintDetail['caseSummary'] {
  const item = value as Partial<NonNullable<ComplaintDetail['caseSummary']>>;
  return typeof item?.id === 'string' && typeof item.type === 'string' && typeof item.status === 'string' && typeof item.lifecycleStatus === 'string' && typeof item.confidentialityLevel === 'string' && typeof item.branchId === 'string' && typeof item.branchName === 'string'
    ? { id: item.id, type: item.type, status: item.status, lifecycleStatus: item.lifecycleStatus, confidentialityLevel: item.confidentialityLevel, branchId: item.branchId, branchName: item.branchName, ownerId: typeof item.ownerId === 'string' ? item.ownerId : null, ownerName: typeof item.ownerName === 'string' ? item.ownerName : null }
    : null;
}

function statusHistoryItem(item: unknown): item is ComplaintDetail['statusHistory'][number] {
  const row = item as Partial<ComplaintDetail['statusHistory'][number]>;
  return typeof row?.id === 'string' && typeof row.toStatus === 'string' && typeof row.createdAt === 'string';
}

function hasStaffSessionCookie(cookieHeader: string): boolean {
  return cookieHeader.split(';').some((cookie) => cookie.trim().startsWith(`${STAFF_SESSION_COOKIE}=`));
}

async function incomingCookieHeader(): Promise<string> {
  try {
    const { cookies } = await import('next/headers');
    return (await cookies()).toString();
  } catch {
    return '';
  }
}

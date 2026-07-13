import { ComplaintStatus, RoleCode, SlaStage, WorkingCalendarMode } from '@prisma/client';
import type { SlaService } from '../sla/sla.service.js';
import type { ComplaintDetailDto, ComplaintQueueItemDto } from './dto/complaint-response.dto.js';
import type { ComplaintDetailRecord, ComplaintQueueRecord, ComplaintReportRecord, ComplaintSearchRecord } from './complaints.repository.js';
import type { ComplaintReportRow, ComplaintSearchRow } from './complaints.service.js';

const MASKED = '[masked]';

export function queueItem(complaint: ComplaintQueueRecord, slaService?: SlaService): ComplaintQueueItemDto {
  const sla = slaSnapshot(complaint, slaService);
  return {
    id: complaint.id,
    referenceNumber: complaint.referenceNumber,
    status: complaint.status,
    severity: complaint.severity,
    subject: complaint.subject,
    branchId: complaint.branchId,
    branchName: complaint.branch.nameEn,
    displayTimeZone: complaint.branch.timezone,
    ownerId: complaint.ownerId,
    ownerName: complaint.owner?.nameEn ?? null,
    ...sla,
    nextAction: nextComplaintAction(complaint),
    createdAt: complaint.createdAt.toISOString(),
    updatedAt: complaint.updatedAt.toISOString(),
  };
}

export function reportItem(complaint: ComplaintReportRecord): ComplaintReportRow {
  return { id: complaint.id, referenceNumber: complaint.referenceNumber, branchId: complaint.branchId, categoryId: complaint.categoryId, status: complaint.status, severity: complaint.severity, subject: complaint.subject, ownerId: complaint.ownerId, displayTimeZone: complaint.branch.timezone, createdAt: complaint.createdAt.toISOString(), updatedAt: complaint.updatedAt.toISOString() };
}

export function searchItem(complaint: ComplaintSearchRecord, masked = false, slaService?: SlaService): ComplaintSearchRow {
  return { ...queueItem(complaint, slaService), categoryId: complaint.categoryId, customerName: complaint.customerName, customerPhone: masked ? MASKED : complaint.customerPhone, customerIdentifier: masked ? MASKED : complaint.customerIdentifier };
}

export function detailItem(complaint: ComplaintDetailRecord, masked = false, slaService?: SlaService): Omit<ComplaintDetailDto, 'caseSummary'> {
  const vehicle = complaint.vehicle ? { id: complaint.vehicle.id, vin: masked ? MASKED : complaint.vehicle.vin, plate: masked ? MASKED : complaint.vehicle.plate, make: complaint.vehicle.makeEn, model: complaint.vehicle.modelEn, year: complaint.vehicle.year, source: complaint.vehicle.dataSource } : null;
  return { ...queueItem(complaint, slaService), categoryId: complaint.category.id, categoryName: complaint.category.nameEn, categoryNameAr: complaint.category.nameAr, description: complaint.descriptionEn, incidentAt: complaint.incidentAt?.toISOString() ?? null, customer: { id: complaint.customer.id, name: complaint.customer.nameEn, phone: masked ? MASKED : complaint.customer.phone, identifier: masked ? MASKED : complaint.customer.dmsCode, source: complaint.customer.dataSource }, vehicle, customerSource: complaint.customerDataSource, manualCustomer: complaint.manualCustomerFlag, vehicleRelated: complaint.vehicleRelated, vehicleSource: complaint.vehicleDataSource, manualVehicle: complaint.manualVehicleFlag, vehicleDataUnavailableReason: complaint.vehicleDataUnavailableReason, statusHistory: complaint.statusHistory.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() })), allowedActions: [] };
}

export function shouldMask(input: { role?: RoleCode | null }): boolean {
  return input.role === RoleCode.MGMT_READONLY;
}

function slaSnapshot(complaint: Pick<ComplaintQueueRecord, 'branch' | 'createdAt' | 'severity' | 'status'>, slaService?: SlaService): Pick<ComplaintQueueItemDto, 'slaDueAt' | 'slaPercentElapsed' | 'slaStage' | 'slaState'> {
  if (complaint.status === ComplaintStatus.CLOSED || complaint.status === ComplaintStatus.REJECTED) return { slaState: 'CLOSED', slaDueAt: null, slaStage: null, slaPercentElapsed: null };
  if (!slaService) return { slaState: 'ON_TRACK', slaDueAt: null, slaStage: SlaStage.RESOLUTION, slaPercentElapsed: null };
  const durationMinutes = slaService.defaultDurationMinutes(complaint.severity);
  const deadline = slaService.calculateDeadline({ severity: complaint.severity, stage: SlaStage.RESOLUTION, durationMinutes, warningPercent: 80, branchTimezone: complaint.branch.timezone, workingCalendarMode: WorkingCalendarMode.ALWAYS_ON, enteredAt: complaint.createdAt });
  const nowMs = Date.now();
  const enteredMs = complaint.createdAt.getTime();
  const dueMs = new Date(deadline.dueAt).getTime();
  const warningMs = new Date(deadline.warningAt).getTime();
  const percent = Math.max(0, Math.min(100, Math.round(((nowMs - enteredMs) / (durationMinutes * 60_000)) * 100)));
  return { slaState: nowMs >= dueMs ? 'BREACHED' : nowMs >= warningMs ? 'WARNING' : 'ON_TRACK', slaDueAt: deadline.dueAt, slaStage: deadline.stage, slaPercentElapsed: percent };
}

function nextComplaintAction(complaint: Pick<ComplaintQueueRecord, 'owner' | 'status'>): string | null {
  if (complaint.status === ComplaintStatus.CLOSED || complaint.status === ComplaintStatus.REJECTED) return null;
  if (complaint.owner?.nameEn) return `Next response from ${complaint.owner.nameEn}`;
  return ({ DRAFT: 'Submit complaint', SUBMITTED: 'Manager intake review', MANAGER_REVIEW: 'Manager routing decision', BRANCH_REVIEW: 'Branch assignment or resolution', IN_PROGRESS: 'Investigation update', RESOLVED: 'Customer close decision', REOPENED: 'Route reopened complaint' } as Partial<Record<ComplaintStatus, string>>)[complaint.status] ?? null;
}

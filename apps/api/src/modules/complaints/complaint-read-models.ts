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
    branchName: complaint.branch?.nameEn ?? '',
    displayTimeZone: complaint.branch?.timezone ?? 'Asia/Riyadh',
    ownerId: complaint.ownerId,
    ownerName: complaint.owner?.nameEn ?? null,
    assignedDepartmentId: complaint.departmentId ?? null,
    assignedDepartmentName: complaint.department?.nameEn ?? null,
    assignedDepartmentNameAr: complaint.department?.nameAr ?? null,
    categoryId: complaint.category?.id ?? complaint.categoryId ?? null,
    categoryName: complaint.category?.nameEn ?? null,
    ...sla,
    nextAction: nextComplaintAction(complaint),
    createdAt: complaint.createdAt.toISOString(),
    updatedAt: complaint.updatedAt.toISOString(),
  };
}

export function reportItem(complaint: ComplaintReportRecord): ComplaintReportRow {
  return { id: complaint.id, referenceNumber: complaint.referenceNumber, branchId: complaint.branchId, categoryId: complaint.categoryId, status: complaint.status, severity: complaint.severity, subject: complaint.subject, ownerId: complaint.ownerId, assignedDepartmentId: complaint.departmentId, displayTimeZone: complaint.branch?.timezone ?? 'Asia/Riyadh', createdAt: complaint.createdAt.toISOString(), updatedAt: complaint.updatedAt.toISOString() };
}

export function searchItem(complaint: ComplaintSearchRecord, masked = false, slaService?: SlaService): ComplaintSearchRow {
  return { ...queueItem(complaint, slaService), categoryId: complaint.categoryId, customerName: complaint.customerName, customerPhone: masked ? MASKED : complaint.customerPhone, customerIdentifier: masked ? MASKED : complaint.customerIdentifier };
}

export function detailItem(complaint: ComplaintDetailRecord, masked = false, slaService?: SlaService): Omit<ComplaintDetailDto, 'caseSummary'> {
  const vehicle = complaint.vehicle ? { id: complaint.vehicle.id, vin: masked ? MASKED : complaint.vehicle.vin, plate: masked ? MASKED : complaint.vehicle.plate, make: complaint.vehicle.makeEn, model: complaint.vehicle.modelEn, year: complaint.vehicle.year, source: complaint.vehicle.dataSource } : null;
  // Extract tracking information from history
  const statusHistory = Array.isArray(complaint.statusHistory) ? complaint.statusHistory : [];
  const createdByTransition = statusHistory.find((t) => t.action === 'SUBMIT');
  const approvedByTransition = statusHistory.find((t) => t.action === 'ACCEPT_INTAKE' || t.action === 'APPROVE_AND_ROUTE');
  const assignmentActions = ['APPROVE_AND_ROUTE', 'ASSIGN_INVESTIGATION', 'ROUTE_AGAIN'];
  const lastAssignment = [...statusHistory].reverse().find((t) => t.action && assignmentActions.includes(t.action));

  const createdBy = createdByTransition?.actor ? { name: createdByTransition.actor.nameEn, nameAr: createdByTransition.actor.nameAr } : null;
  const approvedBy = approvedByTransition?.actor ? { name: approvedByTransition.actor.nameEn, nameAr: approvedByTransition.actor.nameAr } : null;
  const assignedBy = lastAssignment?.actor ? { name: lastAssignment.actor.nameEn, nameAr: lastAssignment.actor.nameAr, ...(lastAssignment.actor.department?.nameEn ? { departmentName: lastAssignment.actor.department.nameEn } : {}), ...(lastAssignment.actor.department?.nameAr ? { departmentNameAr: lastAssignment.actor.department.nameAr } : {}) } : null;

  return {
    ...queueItem(complaint, slaService),
    categoryId: complaint.category?.id ?? complaint.categoryId ?? '',
    categoryName: complaint.category?.nameEn ?? '',
    categoryNameAr: complaint.category?.nameAr ?? complaint.category?.nameEn ?? '',
    description: complaint.descriptionEn ?? '',
    incidentAt: complaint.incidentAt?.toISOString() ?? null,
    customer: complaint.customer ? { id: complaint.customer.id, name: complaint.customer.nameEn ?? '', phone: masked ? MASKED : complaint.customer.phone, identifier: masked ? MASKED : complaint.customer.dmsCode, source: complaint.customer.dataSource ?? 'LOCAL' } : { id: '', name: 'Unknown Customer', phone: null, identifier: null, source: 'LOCAL' },
    vehicle,
    customerSource: complaint.customerDataSource ?? 'LOCAL',
    manualCustomer: complaint.manualCustomerFlag ?? false,
    vehicleRelated: complaint.vehicleRelated ?? false,
    vehicleSource: complaint.vehicleDataSource ?? null,
    manualVehicle: complaint.manualVehicleFlag ?? false,
    vehicleDataUnavailableReason: complaint.vehicleDataUnavailableReason ?? null,
    channel: (complaint as any).channel ?? null,
    customerType: (complaint as any).customerType ?? null,
    lastServiceDate: (complaint as any).lastServiceDate?.toISOString?.() ?? null,
    odometer: (complaint as any).odometer ?? null,
    warrantyActive: (complaint as any).warrantyActive ?? null,
    salesAdvisorName: (complaint as any).salesAdvisorName ?? null,
    rootCauseCategory: (complaint as any).rootCauseCategory ?? null,
    repeatCustomer: (complaint as any).repeatCustomer ?? null,
    alternativeCarProvided: (complaint as any).alternativeCarProvided ?? false,
    backupOfficerId: (complaint as any).backupOfficerId ?? null,
    backupOfficerName: (complaint as any).backupOfficer?.nameEn ?? null,
    collaboratorId: (complaint as any).collaboratorId ?? null,
    collaboratorName: (complaint as any).collaborator?.nameEn ?? null,
    isJustified: (complaint as any).isJustified ?? null,
    satisfactionStatus: (complaint as any).satisfactionStatus ?? null,
    investigationNotes: (complaint as any).investigationNotes ?? null,
    investigatedAt: (complaint as any).investigatedAt?.toISOString?.() ?? null,
    statusHistory: statusHistory.map((item) => ({ ...item, createdAt: item.createdAt?.toISOString?.() ?? String(item.createdAt) })),
    allowedActions: [],
    createdBy,
    approvedBy,
    assignedBy,
  };
}

export function shouldMask(input: { role?: string | null }): boolean {
  return input.role === RoleCode.MGMT_READONLY;
}

function slaSnapshot(complaint: Pick<ComplaintQueueRecord, 'branch' | 'createdAt' | 'severity' | 'status' | 'resolvedAt' | 'closedAt'>, slaService?: SlaService): Pick<ComplaintQueueItemDto, 'slaDueAt' | 'slaPercentElapsed' | 'slaStage' | 'slaState'> {
  const isCompleted = complaint.status === ComplaintStatus.RESOLVED || complaint.status === ComplaintStatus.CLOSED || complaint.status === ComplaintStatus.REJECTED;
  if (!slaService) return { slaState: isCompleted ? 'CLOSED' : 'ON_TRACK', slaDueAt: null, slaStage: SlaStage.RESOLUTION, slaPercentElapsed: null };
  const durationMinutes = slaService.defaultDurationMinutes(complaint.severity);
  const deadline = slaService.calculateDeadline({ severity: complaint.severity, stage: SlaStage.RESOLUTION, durationMinutes, warningPercent: 80, branchTimezone: complaint.branch?.timezone ?? 'Asia/Riyadh', workingCalendarMode: WorkingCalendarMode.ALWAYS_ON, enteredAt: complaint.createdAt });
  
  const nowMs = isCompleted ? (complaint.resolvedAt?.getTime() ?? complaint.closedAt?.getTime() ?? Date.now()) : Date.now();
  const enteredMs = complaint.createdAt.getTime();
  const dueMs = new Date(deadline.dueAt).getTime();
  const warningMs = new Date(deadline.warningAt).getTime();
  const percent = Math.max(0, Math.min(100, Math.round(((nowMs - enteredMs) / (durationMinutes * 60_000)) * 100)));
  return { slaState: isCompleted ? 'CLOSED' : (nowMs >= dueMs ? 'BREACHED' : nowMs >= warningMs ? 'WARNING' : 'ON_TRACK'), slaDueAt: deadline.dueAt, slaStage: deadline.stage, slaPercentElapsed: percent };
}

function nextComplaintAction(complaint: Pick<ComplaintQueueRecord, 'owner' | 'department' | 'status'>): string | null {
  if (complaint.status === ComplaintStatus.CLOSED || complaint.status === ComplaintStatus.REJECTED) return null;
  if (complaint.owner?.nameEn) return `Next response from ${complaint.owner.nameEn}`;
  if (complaint.department?.nameEn) return `Next response from ${complaint.department.nameEn}`;
  return ({ DRAFT: 'Submit complaint', SUBMITTED: 'Manager intake review', MANAGER_REVIEW: 'Manager routing decision', BRANCH_REVIEW: 'Branch assignment or resolution', IN_PROGRESS: 'Investigation update', RESOLVED: 'Customer close decision', REOPENED: 'Route reopened complaint' } as Partial<Record<ComplaintStatus, string>>)[complaint.status] ?? null;
}

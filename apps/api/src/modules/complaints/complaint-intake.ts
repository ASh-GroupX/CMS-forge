import { HttpStatus } from '@nestjs/common';
import { ComplaintSeverity, ComplaintStatus } from '@prisma/client';
import type { AuditRecordInput } from '../../core/audit.service.js';
import { AppException } from '../../core/http-kernel.js';
import type { ComplaintRecord, CreateComplaintData, DataSource } from './complaints.repository.js';
import type { CreateInternalComplaintInput } from './complaints.service.js';

export function createComplaintData(input: CreateInternalComplaintInput): Omit<CreateComplaintData, 'referenceNumber'> {
  const vehicleReason = optionalText(input.vehicleDataUnavailableReason);
  const customerName = (input.customerName ?? '').trim();
  const subject = (input.subject && input.subject.trim()) ? input.subject.trim() : customerName;
  const isVehicleRequired = input.vehicleRelated !== false && !vehicleReason;
  const errors = [
    ...requiredTextError(customerName, 'customerName'),
    ...contactErrors(input),
    ...requiredTextError(input.categoryId, 'categoryId'),
    ...requiredTextError(input.description, 'description'),
    ...requiredTextError(input.branchId, 'branchId'),
    ...(isVehicleRequired ? vinErrors(input.vehicleVin) : (input.vehicleVin ? vinErrors(input.vehicleVin) : [])),
    ...requiredEnumError(input.severity, ComplaintSeverity, 'severity'),
    ...incidentAtErrors(input.incidentAt),
  ];
  if (errors.length) throw new AppException('VALIDATION_FAILED', 'Invalid complaint request', HttpStatus.BAD_REQUEST, errors);
  const customerNumber = optionalText(input.customerNumber) ?? generateDefaultCustomerNumber();
  const customerDataSource = sourceOrDefault(input.customerSource, input.customerNumber && !input.customerNumber.startsWith('CUST-') ? 'DMS' : 'MANUAL');
  const vehicleDataSource = input.vehicleRelated !== false
    ? sourceOrDefault(input.vehicleSource, input.vehicleId ? 'LOCAL' : 'MANUAL')
    : null;
  return {
    status: input.saveAsDraft === true ? ComplaintStatus.DRAFT : ComplaintStatus.SUBMITTED,
    type: (input.type as any) ?? 'COMPLAINT',
    subject,
    severity: input.severity,
    branchId: input.branchId.trim(),
    categoryId: input.categoryId.trim(),
    customerName,
    customerPhone: optionalText(input.customerPhone),
    customerNumber,
    customerDataSource,
    manualCustomerFlag: customerDataSource === 'MANUAL',
    vehicleId: optionalText(input.vehicleId),
    vehicleVin: optionalText(input.vehicleVin),
    vehiclePlate: optionalText(input.vehiclePlate),
    vehicleBrand: optionalText(input.vehicleBrand),
    vehicleModel: optionalText(input.vehicleModel),
    vehicleModelYear: input.vehicleModelYear ?? null,
    vehicleDataSource,
    manualVehicleFlag: vehicleDataSource === 'MANUAL',
    vehicleRelated: input.vehicleRelated !== false,
    vehicleDataUnavailableReason: vehicleReason,
    channel: optionalText(input.channel),
    customerType: optionalText(input.customerType),
    lastServiceDate: input.lastServiceDate ?? null,
    odometer: input.odometer ?? null,
    warrantyActive: input.warrantyActive ?? null,
    salesAdvisorName: optionalText(input.salesAdvisorName),
    rootCauseCategory: optionalText(input.rootCauseCategory),
    repeatCustomer: input.repeatCustomer ?? null,
    departmentId: optionalText(input.departmentId),
    ownerId: optionalText(input.ownerId),
    backupOfficerId: optionalText(input.backupOfficerId),
    collaboratorId: optionalText(input.collaboratorId),
    alternativeCarProvided: input.alternativeCarProvided === true,
    createdById: input.actorId ?? null,
    descriptionEn: input.description.trim(),
    incidentAt: new Date(input.incidentAt),
    templateId: optionalText(input.templateId),
    templateData: input.templateData !== undefined ? input.templateData : undefined,
  };
}

export function complaintCreatedAudit(input: CreateInternalComplaintInput, complaint: ComplaintRecord): AuditRecordInput {
  const customerSource = sourceOrDefault(input.customerSource, input.customerNumber && !input.customerNumber.startsWith('CUST-') ? 'DMS' : 'MANUAL');
  const vehicleSource = input.vehicleRelated ? sourceOrDefault(input.vehicleSource, input.vehicleId ? 'LOCAL' : 'MANUAL') : null;
  return {
    eventType: 'COMPLAINT', action: 'complaint_created', actorId: input.actorId ?? null,
    branchId: complaint.branchId, targetType: 'complaint', targetId: complaint.id,
    correlationId: input.correlationId ?? null,
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
    metadata: {
      referenceNumber: customerReference(complaint.referenceNumber),
      status: complaint.status,
      severity: complaint.severity,
      customerSource,
      manualCustomer: customerSource === 'MANUAL',
      vehicleSource,
      manualVehicle: vehicleSource === 'MANUAL',
      vehicleDataUnavailableReasonPresent: Boolean(optionalText(input.vehicleDataUnavailableReason)),
      ...(input.manualTriage === true ? { manualTriage: true } : {}),
    },
  };
}

export function isReferenceConflict(error: unknown): boolean {
  const candidate = error as { code?: string; meta?: { target?: unknown } };
  return candidate?.code === 'P2002' && JSON.stringify(candidate.meta?.target ?? '').includes('reference');
}

export function referenceConflictError(): AppException {
  return new AppException('COMPLAINT_REFERENCE_CONFLICT', 'Could not allocate a unique complaint reference.', HttpStatus.CONFLICT);
}

function customerReference(referenceNumber: string): string | null { return referenceNumber.startsWith('CMS-') ? referenceNumber : null; }
function optionalText(value: string | null | undefined): string | null { return typeof value === 'string' && value.trim() ? value.trim() : null; }
function sourceOrDefault(value: DataSource | null | undefined, fallback: DataSource): DataSource { return value ?? fallback; }
function requiredTextError(value: unknown, field: string) { return typeof value === 'string' && value.trim() ? [] : [{ field, code: 'REQUIRED', message: `${field} is required.` }]; }
function contactErrors(input: CreateInternalComplaintInput) {
  return optionalText(input.customerPhone)
    ? []
    : [{ field: 'customerPhone', code: 'REQUIRED', message: 'customerPhone is required.' }];
}
function vinErrors(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) {
    return [{ field: 'vehicleVin', code: 'REQUIRED', message: 'vehicleVin is required.' }];
  }
  const trimmed = value.trim();
  if (/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(trimmed)) {
    return [{ field: 'vehicleVin', code: 'INVALID_VIN', message: 'vehicleVin cannot contain Arabic characters.' }];
  }
  return [];
}
function generateDefaultCustomerNumber(): string {
  const randomDigits = Math.floor(100000 + Math.random() * 900000);
  return `CUST-${randomDigits}`;
}
function requiredEnumError<T extends Record<string, string>>(value: unknown, options: T, field: string) { return typeof value === 'string' && Object.values(options).includes(value) ? [] : [{ field, code: 'REQUIRED', message: `${field} is required.` }]; }
function incidentAtErrors(value: unknown) {
  const date = value instanceof Date || typeof value === 'string' ? new Date(value) : null;
  return date && !Number.isNaN(date.valueOf()) ? [] : [{ field: 'incidentAt', code: 'REQUIRED', message: 'incidentAt is required.' }];
}

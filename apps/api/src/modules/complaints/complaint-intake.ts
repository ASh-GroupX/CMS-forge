import { HttpStatus } from '@nestjs/common';
import { ComplaintSeverity, ComplaintStatus } from '@prisma/client';
import type { AuditRecordInput } from '../../core/audit.service.js';
import { AppException } from '../../core/http-kernel.js';
import type { ComplaintRecord, CreateComplaintData, DataSource } from './complaints.repository.js';
import type { CreateInternalComplaintInput } from './complaints.service.js';

export function createComplaintData(input: CreateInternalComplaintInput): Omit<CreateComplaintData, 'referenceNumber'> {
  const vehicleReason = optionalText(input.vehicleDataUnavailableReason);
  const missingVehicleData = input.vehicleRelated && !optionalText(input.vehicleId) && !optionalText(input.vehicleVin) && !vehicleReason;
  const errors = [
    ...requiredTextError(input.customerName, 'customerName'),
    ...contactErrors(input),
    ...requiredTextError(input.categoryId, 'categoryId'),
    ...requiredTextError(input.subcategoryId, 'subcategoryId'),
    ...requiredTextError(input.description, 'description'),
    ...requiredTextError(input.branchId, 'branchId'),
    ...requiredTextError(input.subject, 'subject'),
    ...requiredEnumError(input.severity, ComplaintSeverity, 'severity'),
    ...incidentAtErrors(input.incidentAt),
    ...(missingVehicleData ? requiredTextError(input.vehicleVin, 'vehicleVin') : []),
    ...(missingVehicleData ? requiredTextError(input.vehicleDataUnavailableReason, 'vehicleDataUnavailableReason') : []),
  ];
  if (errors.length) throw new AppException('VALIDATION_FAILED', 'Invalid complaint request', HttpStatus.BAD_REQUEST, errors);
  const customerDataSource = sourceOrDefault(input.customerSource, input.customerNumber ? 'DMS' : 'MANUAL');
  const vehicleDataSource = input.vehicleRelated
    ? sourceOrDefault(input.vehicleSource, input.vehicleId ? 'LOCAL' : 'MANUAL')
    : null;
  return {
    status: input.saveAsDraft === true ? ComplaintStatus.DRAFT : ComplaintStatus.SUBMITTED,
    subject: input.subject.trim(),
    severity: input.severity,
    branchId: input.branchId.trim(),
    categoryId: input.subcategoryId.trim(),
    customerName: input.customerName.trim(),
    customerPhone: optionalText(input.customerPhone),
    customerNumber: optionalText(input.customerNumber),
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
    vehicleRelated: input.vehicleRelated === true,
    vehicleDataUnavailableReason: vehicleReason,
    departmentId: optionalText(input.departmentId),
    createdById: input.actorId ?? null,
    descriptionEn: input.description.trim(),
    incidentAt: new Date(input.incidentAt),
  };
}

export function complaintCreatedAudit(input: CreateInternalComplaintInput, complaint: ComplaintRecord): AuditRecordInput {
  const customerSource = sourceOrDefault(input.customerSource, input.customerNumber ? 'DMS' : 'MANUAL');
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
function contactErrors(input: CreateInternalComplaintInput) { return optionalText(input.customerPhone) || optionalText(input.customerNumber) ? [] : [{ field: 'customerPhone', code: 'REQUIRED', message: 'customerPhone or customerNumber is required.' }]; }
function requiredEnumError<T extends Record<string, string>>(value: unknown, options: T, field: string) { return typeof value === 'string' && Object.values(options).includes(value) ? [] : [{ field, code: 'REQUIRED', message: `${field} is required.` }]; }
function incidentAtErrors(value: unknown) {
  const date = value instanceof Date || typeof value === 'string' ? new Date(value) : null;
  return date && !Number.isNaN(date.valueOf()) ? [] : [{ field: 'incidentAt', code: 'REQUIRED', message: 'incidentAt is required.' }];
}

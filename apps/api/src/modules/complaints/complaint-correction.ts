import { HttpStatus } from '@nestjs/common';
import type { RoleCode } from '@prisma/client';
import type { AuditRecordInput } from '../../core/audit.service.js';
import { AppException } from '../../core/http-kernel.js';
import type { DataSource } from './complaints.repository.js';

export type ComplaintCorrectionField = 'customerId' | 'customerSource' | 'manualCustomer' | 'vehicleId' | 'vehicleSource' | 'manualVehicle' | 'vehicleRelated' | 'vehicleDataUnavailableReason';
export type ApplyComplaintCorrectionInput = {
  complaintId: string; expectedUpdatedAt: Date; reason: string; customerId?: string; customerSource?: DataSource; manualCustomer?: boolean;
  vehicleId?: string | null; vehicleSource?: DataSource | null; manualVehicle?: boolean; vehicleRelated?: boolean; vehicleDataUnavailableReason?: string | null;
  actorId?: string | null; actorRole: RoleCode; sessionId?: string | null; correlationId?: string | null; ipAddress?: string | null; userAgent?: string | null;
};
export type ComplaintCorrectionData = {
  complaintId: string; expectedUpdatedAt: Date; changedFields: ComplaintCorrectionField[]; customerId?: string; customerDataSource?: DataSource; manualCustomerFlag?: boolean;
  vehicleId?: string | null; vehicleDataSource?: DataSource | null; manualVehicleFlag?: boolean; vehicleRelated?: boolean; vehicleDataUnavailableReason?: string | null;
};
export type ComplaintCorrectionRecord = { id: string; branchId: string };
export type ApplyComplaintCorrectionResult = { complaintId: string; changedFields: ComplaintCorrectionField[] };

export function complaintCorrectionData(input: ApplyComplaintCorrectionInput): ComplaintCorrectionData {
  if (!input.reason.trim()) throw correctionValidationError('reason', 'reason is required.');
  const data: ComplaintCorrectionData = { complaintId: input.complaintId, expectedUpdatedAt: input.expectedUpdatedAt, changedFields: [] };
  if (has(input, 'customerId')) set(data, 'customerId', textOrThrow(input.customerId, 'customerId'), 'customerId');
  if (has(input, 'customerSource')) set(data, 'customerDataSource', input.customerSource, 'customerSource');
  if (has(input, 'manualCustomer')) set(data, 'manualCustomerFlag', input.manualCustomer, 'manualCustomer');
  if (has(input, 'vehicleId')) set(data, 'vehicleId', nullableTextOrThrow(input.vehicleId, 'vehicleId'), 'vehicleId');
  if (has(input, 'vehicleSource')) set(data, 'vehicleDataSource', input.vehicleSource, 'vehicleSource');
  if (has(input, 'manualVehicle')) set(data, 'manualVehicleFlag', input.manualVehicle, 'manualVehicle');
  if (has(input, 'vehicleRelated')) set(data, 'vehicleRelated', input.vehicleRelated, 'vehicleRelated');
  if (has(input, 'vehicleDataUnavailableReason')) set(data, 'vehicleDataUnavailableReason', nullableTextOrThrow(input.vehicleDataUnavailableReason, 'vehicleDataUnavailableReason'), 'vehicleDataUnavailableReason');
  if (data.changedFields.length === 0) throw correctionValidationError('changedFields', 'At least one correction field is required.');
  return data;
}

export function complaintCorrectionAudit(input: ApplyComplaintCorrectionInput, branchId: string, changedFields: ComplaintCorrectionField[]): AuditRecordInput {
  return { eventType: 'COMPLAINT', action: 'complaint_updated', actorId: input.actorId ?? null, branchId, targetType: 'complaint', targetId: input.complaintId, correlationId: input.correlationId ?? null, ipAddress: input.ipAddress ?? null, userAgent: input.userAgent ?? null, metadata: { changedFields } };
}

export function correctionConflictError(): AppException { return new AppException('COMPLAINT_INVALID_TRANSITION', 'Complaint correction could not be applied.', HttpStatus.CONFLICT); }

function set<U extends keyof Omit<ComplaintCorrectionData, 'changedFields'>>(data: ComplaintCorrectionData, target: U, value: ComplaintCorrectionData[U], field: ComplaintCorrectionField): void {
  data[target] = value;
  data.changedFields.push(field);
}

function textOrThrow(value: unknown, field: string): string { if (typeof value === 'string' && value.trim()) return value.trim(); throw correctionValidationError(field, `${field} must be a non-empty string.`); }
function nullableTextOrThrow(value: unknown, field: string): string | null { return value === null ? null : textOrThrow(value, field); }
function has<T extends object, K extends PropertyKey>(value: T, key: K): value is T & Record<K, unknown> { return Object.prototype.hasOwnProperty.call(value, key); }
function correctionValidationError(field: string, message: string): AppException { return new AppException('VALIDATION_FAILED', 'Invalid complaint correction request', HttpStatus.BAD_REQUEST, [{ field, code: field === 'reason' ? 'REQUIRED' : 'INVALID', message }]); }

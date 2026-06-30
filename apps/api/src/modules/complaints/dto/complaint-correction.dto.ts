import { HttpStatus } from '@nestjs/common';
import { RoleCode } from '@prisma/client';
import { AppException } from '../../../core/http-kernel.js';
import type { ApplyComplaintCorrectionInput, ApplyComplaintCorrectionResult } from '../complaint-correction.js';
import type { DataSource } from '../complaints.repository.js';

const DATA_SOURCES = ['LOCAL', 'MANUAL', 'DMS'] as const satisfies readonly DataSource[];

export type ComplaintCorrectionRequestDto = {
  expectedUpdatedAt: Date; reason: string; customerId?: string; customerSource?: DataSource; manualCustomer?: boolean;
  vehicleId?: string | null; vehicleSource?: DataSource | null; manualVehicle?: boolean; vehicleRelated?: boolean; vehicleDataUnavailableReason?: string | null;
};
export type ComplaintCorrectionResponseDto = { correction: ApplyComplaintCorrectionResult };

export function parseComplaintCorrectionBody(body: unknown): ComplaintCorrectionRequestDto {
  const input = objectBody(body);
  const parsed: ComplaintCorrectionRequestDto = { expectedUpdatedAt: dateValue(input.expectedUpdatedAt, 'expectedUpdatedAt'), reason: requiredText(input.reason, 'reason') };
  assign(parsed, 'customerId', optionalRequiredText(input.customerId, 'customerId'));
  assign(parsed, 'customerSource', optionalRequiredDataSource(input.customerSource, 'customerSource'));
  assign(parsed, 'manualCustomer', optionalBoolean(input.manualCustomer, 'manualCustomer'));
  assign(parsed, 'vehicleId', optionalText(input.vehicleId, 'vehicleId'));
  assign(parsed, 'vehicleSource', optionalDataSource(input.vehicleSource, 'vehicleSource', true));
  assign(parsed, 'manualVehicle', optionalBoolean(input.manualVehicle, 'manualVehicle'));
  assign(parsed, 'vehicleRelated', optionalBoolean(input.vehicleRelated, 'vehicleRelated'));
  assign(parsed, 'vehicleDataUnavailableReason', optionalText(input.vehicleDataUnavailableReason, 'vehicleDataUnavailableReason'));
  if (Object.keys(parsed).length === 2) throw invalid('changedFields', 'At least one correction field is required.');
  return parsed;
}

export function toComplaintCorrectionInput(complaintId: string, body: ComplaintCorrectionRequestDto, context: { actorId: string | null; actorRole: RoleCode; sessionId: string | null; correlationId: string | null; ipAddress: string | null; userAgent: string | null }): ApplyComplaintCorrectionInput {
  return { complaintId, ...body, actorId: context.actorId, actorRole: context.actorRole, sessionId: context.sessionId, correlationId: context.correlationId, ipAddress: context.ipAddress, userAgent: context.userAgent };
}

function objectBody(body: unknown): Record<string, unknown> { if (!body || typeof body !== 'object' || Array.isArray(body)) throw invalid('body', 'Request body must be an object.'); return body as Record<string, unknown>; }
function requiredText(value: unknown, field: string): string { if (typeof value === 'string' && value.trim()) return value.trim(); throw invalid(field, `${field} is required.`); }
function optionalText(value: unknown, field: string): string | null | undefined { if (value === undefined) return undefined; if (value === null) return null; if (typeof value === 'string' && value.trim()) return value.trim(); throw invalid(field, `${field} must be a non-empty string when provided.`); }
function optionalRequiredText(value: unknown, field: string): string | undefined { if (value === undefined) return undefined; if (typeof value === 'string' && value.trim()) return value.trim(); throw invalid(field, `${field} must be a non-empty string when provided.`); }
function optionalBoolean(value: unknown, field: string): boolean | undefined { if (value === undefined) return undefined; if (typeof value === 'boolean') return value; throw invalid(field, `${field} must be a boolean.`); }
function optionalDataSource(value: unknown, field: string, nullable: boolean): DataSource | null | undefined { if (value === undefined) return undefined; if (value === null && nullable) return null; if (typeof value === 'string' && (DATA_SOURCES as readonly string[]).includes(value)) return value as DataSource; throw invalid(field, `${field} is invalid.`); }
function optionalRequiredDataSource(value: unknown, field: string): DataSource | undefined { if (value === undefined) return undefined; if (typeof value === 'string' && (DATA_SOURCES as readonly string[]).includes(value)) return value as DataSource; throw invalid(field, `${field} is invalid.`); }
function dateValue(value: unknown, field: string): Date { if (typeof value !== 'string' || !value.trim()) throw invalid(field, `${field} is required.`); const date = new Date(value); if (Number.isNaN(date.getTime())) throw invalid(field, `${field} must be a valid date-time.`); return date; }
function assign<T extends object, K extends keyof T>(target: T, key: K, value: T[K] | undefined): void { if (value !== undefined) target[key] = value; }
function invalid(field: string, message: string): AppException { return new AppException('VALIDATION_FAILED', 'Invalid complaint correction request', HttpStatus.BAD_REQUEST, [{ field, code: field === 'reason' || field === 'expectedUpdatedAt' ? 'REQUIRED' : 'INVALID', message }]); }

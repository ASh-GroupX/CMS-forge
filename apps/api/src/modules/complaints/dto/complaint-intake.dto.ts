import { ComplaintSeverity } from '@prisma/client';
import { HttpStatus } from '@nestjs/common';
import { AppException } from '../../../core/http-kernel.js';
export type IntakeCorrection = { customerName: string; customerPhone: string; vehicleMake: string; vehicleModel: string; vehicleVin: string | null; odometer: number | null; incidentAt: Date; description: string; branchId: string; categoryId: string; severity: ComplaintSeverity; departmentId: string | null; ownerId: string | null; reason: string; customFields?: Record<string, unknown> };
export function invalidIntake(field = 'body'): never { throw new AppException('VALIDATION_FAILED', 'Invalid intake data', HttpStatus.BAD_REQUEST, [{ field, code: 'INVALID', message: 'Check this field.' }]); }
export function intakeBody(body: unknown): Record<string, unknown> { if (!body || typeof body !== 'object' || Array.isArray(body)) invalidIntake(); return body as Record<string, unknown>; }
export function intakeVersion(body: Record<string, unknown>): string { const value = body.expectedVersion; if (typeof value !== 'string' || !Number.isFinite(Date.parse(value))) invalidIntake('expectedVersion'); return new Date(value).toISOString(); }
export function parseIntakeCorrection(body: Record<string, unknown>): IntakeCorrection {
  const text = (field: string, max = 200): string => { const value = body[field]; if (typeof value !== 'string' || !value.trim() || value.length > max) invalidIntake(field); return value.trim(); };
  const optional = (field: string): string | null => body[field] === null || body[field] === '' || body[field] === undefined ? null : text(field);
  const customerPhone = text('customerPhone', 20); if (!/^\+[1-9]\d{7,14}$/.test(customerPhone)) invalidIntake('customerPhone');
  const vehicleVin = optional('vehicleVin'); if (vehicleVin && !/^[A-HJ-NPR-Z0-9]{17}$/i.test(vehicleVin)) invalidIntake('vehicleVin');
  const odometer = body.odometer === null || body.odometer === '' || body.odometer === undefined ? null : body.odometer;
  if (odometer !== null && (typeof odometer !== 'number' || !Number.isSafeInteger(odometer) || odometer < 0 || odometer > 10_000_000)) invalidIntake('odometer');
  const incidentAt = new Date(text('incidentAt')); if (!Number.isFinite(incidentAt.getTime())) invalidIntake('incidentAt');
  if (!Object.values(ComplaintSeverity).includes(body.severity as ComplaintSeverity)) invalidIntake('severity');
  if (body.customFields !== undefined && (!body.customFields || typeof body.customFields !== 'object' || Array.isArray(body.customFields))) invalidIntake('customFields');
  return { customerName: text('customerName'), customerPhone, vehicleMake: text('vehicleMake'), vehicleModel: text('vehicleModel'), vehicleVin: vehicleVin?.toUpperCase() ?? null, odometer: odometer as number | null, incidentAt, description: text('description', 10000), branchId: text('branchId'), categoryId: text('categoryId'), severity: body.severity as ComplaintSeverity, departmentId: optional('departmentId'), ownerId: optional('ownerId'), reason: text('reason', 500), ...(body.customFields ? { customFields: body.customFields as Record<string, unknown> } : {}) };
}

import { HttpStatus } from '@nestjs/common';
import { ComplaintSeverity } from '@prisma/client';
import { AppException } from '../../../core/http-kernel.js';
import type { SubmitPortalComplaintInput } from '../portal.service.js';

export type PortalComplaintRequestDto = {
  customerName: string;
  customerPhone: string;
  customerNumber?: string | null;
  categoryId: string;
  subcategoryId: string;
  description: string;
  incidentAt: string;
  branchId: string;
  subject: string;
  severity: ComplaintSeverity;
  vehicleRelated?: boolean;
  vehicleVin?: string | null;
  vehicleId?: string | null;
};

export function parsePortalComplaintBody(body: unknown): PortalComplaintRequestDto {
  const input = objectBody(body);
  return {
    customerName: requiredText(input.customerName, 'customerName'),
    customerPhone: requiredText(input.customerPhone, 'customerPhone'),
    customerNumber: optionalText(input.customerNumber, 'customerNumber'),
    categoryId: requiredText(input.categoryId, 'categoryId'),
    subcategoryId: requiredText(input.subcategoryId, 'subcategoryId'),
    description: requiredText(input.description, 'description'),
    incidentAt: requiredText(input.incidentAt, 'incidentAt'),
    branchId: requiredText(input.branchId, 'branchId'),
    subject: requiredText(input.subject, 'subject'),
    severity: enumValue(input.severity, ComplaintSeverity, 'severity'),
    vehicleRelated: input.vehicleRelated === true,
    vehicleVin: optionalText(input.vehicleVin, 'vehicleVin'),
    vehicleId: optionalText(input.vehicleId, 'vehicleId'),
  };
}

export function toPortalComplaintInput(
  body: PortalComplaintRequestDto,
  context: Pick<SubmitPortalComplaintInput, 'correlationId' | 'ipAddress' | 'userAgent'>,
): SubmitPortalComplaintInput {
  return { ...body, ...context };
}

function objectBody(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw invalid('body', 'Request body must be an object.');
  }
  return body as Record<string, unknown>;
}

function requiredText(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw invalid(field, `${field} is required.`);
  }
  return value.trim();
}

function optionalText(value: unknown, field: string): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  return requiredText(value, field);
}

function enumValue<T extends Record<string, string>>(value: unknown, options: T, field: string): T[keyof T] {
  if (typeof value === 'string' && Object.values(options).includes(value)) {
    return value as T[keyof T];
  }
  throw invalid(field, `${field} is invalid.`);
}

function invalid(field: string, message: string): AppException {
  return new AppException('VALIDATION_FAILED', 'Invalid portal complaint request', HttpStatus.BAD_REQUEST, [
    { field, code: 'REQUIRED', message },
  ]);
}

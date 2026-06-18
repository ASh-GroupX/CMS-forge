import { HttpStatus } from '@nestjs/common';
import { ComplaintSeverity } from '@prisma/client';
import { AppException } from '../../../core/http-kernel.js';
import type { CreateInternalComplaintInput, ComplaintCreationResult } from '../complaints.service.js';

export type CreateComplaintRequestDto = {
  customerName: string;
  customerPhone?: string | null;
  customerNumber?: string | null;
  categoryId: string;
  subcategoryId: string;
  description: string;
  incidentAt: string;
  subject: string;
  severity: ComplaintSeverity;
  vehicleRelated?: boolean;
  vehicleVin?: string | null;
  vehicleId?: string | null;
};

export type CreateComplaintResponseDto = {
  complaint: ComplaintCreationResult;
};

export function parseCreateComplaintBody(body: unknown): CreateComplaintRequestDto {
  const input = objectBody(body);
  return {
    customerName: requiredText(input.customerName, 'customerName'),
    customerPhone: optionalText(input.customerPhone, 'customerPhone'),
    customerNumber: optionalText(input.customerNumber, 'customerNumber'),
    categoryId: requiredText(input.categoryId, 'categoryId'),
    subcategoryId: requiredText(input.subcategoryId, 'subcategoryId'),
    description: requiredText(input.description, 'description'),
    incidentAt: requiredText(input.incidentAt, 'incidentAt'),
    subject: requiredText(input.subject, 'subject'),
    severity: enumValue(input.severity, ComplaintSeverity, 'severity'),
    vehicleRelated: input.vehicleRelated === true,
    vehicleVin: optionalText(input.vehicleVin, 'vehicleVin'),
    vehicleId: optionalText(input.vehicleId, 'vehicleId'),
  };
}

export function toCreateComplaintInput(
  branchId: string,
  body: CreateComplaintRequestDto,
  context: Pick<CreateInternalComplaintInput, 'actorId' | 'correlationId' | 'ipAddress' | 'userAgent'>,
): CreateInternalComplaintInput {
  const { actorId, correlationId, ipAddress, userAgent } = context;
  return {
    ...body,
    branchId,
    actorId: actorId ?? null,
    correlationId: correlationId ?? null,
    ipAddress: ipAddress ?? null,
    userAgent: userAgent ?? null,
  };
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
  return new AppException('VALIDATION_FAILED', 'Invalid complaint request', HttpStatus.BAD_REQUEST, [
    { field, code: 'REQUIRED', message },
  ]);
}

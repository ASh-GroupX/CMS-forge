import { HttpStatus } from '@nestjs/common';
import { ComplaintSeverity } from '@prisma/client';
import { AppException } from '../../../core/http-kernel.js';
import type { SubmitPortalComplaintInput } from '../portal.service.js';

export type PortalAttachmentRequestDto = {
  fileName: string;
  contentType: string;
  sizeBytes: number;
  contentBase64: string;
  customerVisible?: boolean;
};

export type PortalComplaintRequestDto = {
  customerName: string;
  customerPhone: string;
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
  vehiclePlate?: string | null;
  vehicleBrand?: string | null;
  vehicleModel?: string | null;
  vehicleModelYear?: number | null;
  departmentId?: string | null;
  attachments?: PortalAttachmentRequestDto[];
};

export function parsePortalComplaintBody(body: unknown): PortalComplaintRequestDto {
  const input = objectBody(body);
  const attachments = attachmentList(input.attachments);
  return {
    customerName: requiredText(input.customerName, 'customerName'),
    customerPhone: requiredText(input.customerPhone, 'customerPhone'),
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
    vehiclePlate: optionalText(input.vehiclePlate, 'vehiclePlate'),
    vehicleBrand: optionalText(input.vehicleBrand, 'vehicleBrand'),
    vehicleModel: optionalText(input.vehicleModel, 'vehicleModel'),
    vehicleModelYear: optionalNumber(input.vehicleModelYear, 'vehicleModelYear'),
    departmentId: optionalText(input.departmentId, 'departmentId'),
    ...(attachments.length ? { attachments } : {}),
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

function optionalNumber(value: unknown, field: string): number | null {
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value === 'number' && Number.isInteger(value)) {
    return value;
  }
  throw invalid(field, `${field} is invalid.`);
}

function attachmentList(value: unknown): PortalAttachmentRequestDto[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw invalid('attachments', 'attachments is invalid.');
  try {
    return value.map((item) => portalAttachmentBody(item));
  } catch {
    throw invalid('attachments', 'attachments is invalid.');
  }
}

function portalAttachmentBody(value: unknown): PortalAttachmentRequestDto {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw invalid('attachments', 'attachments is invalid.');
  const input = value as Record<string, unknown>;
  const customerVisible = input.customerVisible === undefined ? undefined : booleanValue(input.customerVisible, 'customerVisible');
  return {
    fileName: requiredText(input.fileName, 'fileName'),
    contentType: requiredText(input.contentType, 'contentType'),
    sizeBytes: positiveInteger(input.sizeBytes, 'sizeBytes'),
    contentBase64: requiredText(input.contentBase64, 'contentBase64'),
    ...(customerVisible === undefined ? {} : { customerVisible }),
  };
}

function positiveInteger(value: unknown, field: string): number {
  if (typeof value === 'number' && Number.isSafeInteger(value) && value > 0) return value;
  throw invalid(field, `${field} is invalid.`);
}

function booleanValue(value: unknown, field: string): boolean {
  if (typeof value === 'boolean') return value;
  throw invalid(field, `${field} is invalid.`);
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

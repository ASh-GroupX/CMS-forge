import { HttpStatus } from '@nestjs/common';
import { ComplaintSeverity } from '@prisma/client';
import { AppException } from '../../../core/http-kernel.js';
import type { CreateInternalComplaintInput, ComplaintCreationResult } from '../complaints.service.js';

const dataSources = ['LOCAL', 'MANUAL', 'DMS'] as const;
type DataSource = typeof dataSources[number];

export type CreateComplaintRequestDto = {
  customerName: string;
  customerPhone?: string | null | undefined;
  customerNumber?: string | null | undefined;
  customerSource?: DataSource | null | undefined;
  categoryId: string;
  description: string;
  incidentAt: string;
  subject: string;
  severity: ComplaintSeverity;
  type?: string | undefined; // New: Action Request, Complaint, etc.
  vehicleRelated?: boolean | undefined;
  vehicleVin?: string | null | undefined;
  vehicleId?: string | null | undefined;
  vehiclePlate?: string | null | undefined;
  vehicleBrand?: string | null | undefined;
  vehicleModel?: string | null | undefined;
  vehicleModelYear?: number | null | undefined;
  channel?: string | undefined;
  customerType?: string | undefined;
  lastServiceDate?: string | null | undefined;
  odometer?: number | null | undefined;
  warrantyActive?: boolean | null | undefined;
  salesAdvisorName?: string | null | undefined;
  rootCauseCategory?: string | null | undefined;
  repeatCustomer?: boolean | null | undefined;
  vehicleSource?: DataSource | null | undefined;
  vehicleDataUnavailableReason?: string | null | undefined;
  departmentId?: string | null | undefined;
  saveAsDraft?: boolean | undefined;
  templateId?: string | null | undefined;
  templateData?: any | undefined;
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
    customerSource: optionalDataSource(input.customerSource, 'customerSource'),
    categoryId: requiredText(input.categoryId, 'categoryId'),
    description: requiredText(input.description, 'description'),
    incidentAt: requiredText(input.incidentAt, 'incidentAt'),
    subject: requiredText(input.subject, 'subject'),
    severity: enumValue(input.severity, ComplaintSeverity as any, 'severity'),
    type: optionalText(input.type, 'type') ?? undefined,
    vehicleRelated: input.vehicleRelated === true,
    vehicleVin: optionalText(input.vehicleVin, 'vehicleVin'),
    vehicleId: optionalText(input.vehicleId, 'vehicleId'),
    vehiclePlate: optionalText(input.vehiclePlate, 'vehiclePlate'),
    vehicleBrand: optionalText(input.vehicleBrand, 'vehicleBrand'),
    vehicleModel: optionalText(input.vehicleModel, 'vehicleModel'),
    vehicleModelYear: optionalNumber(input.vehicleModelYear, 'vehicleModelYear'),
    channel: optionalText(input.channel, 'channel') ?? undefined,
    customerType: optionalText(input.customerType, 'customerType') ?? undefined,
    lastServiceDate: optionalText(input.lastServiceDate, 'lastServiceDate'),
    odometer: optionalNumber(input.odometer, 'odometer'),
    warrantyActive: input.warrantyActive !== undefined ? input.warrantyActive === true : undefined,
    salesAdvisorName: optionalText(input.salesAdvisorName, 'salesAdvisorName'),
    rootCauseCategory: optionalText(input.rootCauseCategory, 'rootCauseCategory'),
    repeatCustomer: input.repeatCustomer !== undefined ? input.repeatCustomer === true : undefined,
    vehicleSource: optionalDataSource(input.vehicleSource, 'vehicleSource'),
    vehicleDataUnavailableReason: optionalText(input.vehicleDataUnavailableReason, 'vehicleDataUnavailableReason'),
    departmentId: optionalText(input.departmentId, 'departmentId'),
    saveAsDraft: input.saveAsDraft === true,
    templateId: optionalText(input.templateId, 'templateId'),
    templateData: input.templateData !== undefined ? input.templateData : undefined,
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
    customerPhone: body.customerPhone ?? null,
    customerNumber: body.customerNumber ?? null,
    customerSource: body.customerSource ?? null,
    type: body.type,
    vehicleRelated: body.vehicleRelated,
    vehicleVin: body.vehicleVin ?? null,
    vehicleId: body.vehicleId ?? null,
    vehiclePlate: body.vehiclePlate ?? null,
    vehicleBrand: body.vehicleBrand ?? null,
    vehicleModel: body.vehicleModel ?? null,
    vehicleModelYear: body.vehicleModelYear ?? null,
    channel: body.channel ?? null,
    customerType: body.customerType ?? null,
    lastServiceDate: body.lastServiceDate ? new Date(body.lastServiceDate) : null,
    odometer: body.odometer ?? null,
    warrantyActive: body.warrantyActive ?? null,
    salesAdvisorName: body.salesAdvisorName ?? null,
    rootCauseCategory: body.rootCauseCategory ?? null,
    repeatCustomer: body.repeatCustomer ?? null,
    vehicleSource: body.vehicleSource ?? null,
    vehicleDataUnavailableReason: body.vehicleDataUnavailableReason ?? null,
    departmentId: body.departmentId ?? null,
    saveAsDraft: body.saveAsDraft,
    templateId: body.templateId ?? null,
    branchId,
    actorId: actorId ?? null,
    correlationId: correlationId ?? null,
    ipAddress: ipAddress ?? null,
    userAgent: userAgent ?? null,
  } as CreateInternalComplaintInput;
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

function optionalDataSource(value: unknown, field: string): DataSource | null {
  if (value === undefined || value === null) return null;
  if (typeof value === 'string' && (dataSources as readonly string[]).includes(value)) return value as DataSource;
  throw invalid(field, `${field} is invalid.`);
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

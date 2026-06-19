import { HttpStatus } from '@nestjs/common';
import { AppException } from '../../../core/http-kernel.js';
import type { CreateAttachmentUploadInput } from '../attachments.service.js';

export type CreateAttachmentRequestDto = {
  fileName: string;
  contentType: string;
  sizeBytes: number;
  contentBase64: string;
  customerVisible?: boolean;
};

export type AttachmentRequestContext = {
  actorId: string | null;
  branchId: string | null;
  correlationId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export function parseCreateAttachmentBody(body: unknown): CreateAttachmentRequestDto {
  if (!isObject(body)) throw invalidAttachmentRequest('body');
  const fileName = stringField(body.fileName, 'fileName');
  const contentType = stringField(body.contentType, 'contentType');
  const contentBase64 = stringField(body.contentBase64, 'contentBase64');
  const sizeBytes = numberField(body.sizeBytes, 'sizeBytes');
  const customerVisible = body.customerVisible === undefined ? undefined : booleanField(body.customerVisible, 'customerVisible');
  return { fileName, contentType, contentBase64, sizeBytes, ...(customerVisible === undefined ? {} : { customerVisible }) };
}

export function toCreateAttachmentInput(
  complaintId: string,
  body: CreateAttachmentRequestDto,
  context: AttachmentRequestContext,
): CreateAttachmentUploadInput {
  const bytes = Buffer.from(body.contentBase64, 'base64');
  if (bytes.byteLength !== body.sizeBytes) throw invalidAttachmentRequest('contentBase64');
  return {
    complaintId,
    fileName: body.fileName,
    contentType: body.contentType,
    sizeBytes: body.sizeBytes,
    bytes,
    uploadedById: context.actorId,
    actorId: context.actorId,
    branchId: context.branchId,
    customerVisible: body.customerVisible ?? false,
    correlationId: context.correlationId ?? null,
    ipAddress: context.ipAddress ?? null,
    userAgent: context.userAgent ?? null,
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringField(value: unknown, field: string): string {
  if (typeof value === 'string' && value.trim()) return value.trim();
  throw invalidAttachmentRequest(field);
}

function numberField(value: unknown, field: string): number {
  if (typeof value === 'number' && Number.isSafeInteger(value) && value > 0) return value;
  throw invalidAttachmentRequest(field);
}

function booleanField(value: unknown, field: string): boolean {
  if (typeof value === 'boolean') return value;
  throw invalidAttachmentRequest(field);
}

function invalidAttachmentRequest(field: string): AppException {
  return new AppException('VALIDATION_FAILED', 'Invalid attachment request', HttpStatus.BAD_REQUEST, [
    { field, code: 'REQUIRED', message: `${field} is required or invalid.` },
  ]);
}

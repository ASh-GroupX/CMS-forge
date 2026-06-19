import { HttpStatus } from '@nestjs/common';
import {
  ComplaintStatus,
  ComplaintTransitionAction,
  RoleCode,
} from '@prisma/client';
import { AppException } from '../../../core/http-kernel.js';
import type { ApplyComplaintTransitionInput, ApplyComplaintTransitionResult } from '../complaints.service.js';

export type ComplaintTransitionRequestDto = {
  fromStatus: ComplaintStatus;
  action: ComplaintTransitionAction;
  reason?: string | null;
  resolutionType?: string | null;
  resolutionSummary?: string | null;
  customerCommunicationStatus?: string | null;
};

export type ComplaintTransitionResponseDto = {
  transition: ApplyComplaintTransitionResult;
};

export function parseComplaintTransitionBody(body: unknown): ComplaintTransitionRequestDto {
  const input = objectBody(body);
  const reason = optionalText(input.reason, 'reason');
  const resolutionType = optionalText(input.resolutionType, 'resolutionType');
  const resolutionSummary = optionalText(input.resolutionSummary, 'resolutionSummary');
  const customerCommunicationStatus = optionalText(input.customerCommunicationStatus, 'customerCommunicationStatus');
  return {
    fromStatus: enumValue(input.fromStatus, ComplaintStatus, 'fromStatus'),
    action: enumValue(input.action, ComplaintTransitionAction, 'action'),
    ...(reason === undefined ? {} : { reason }),
    ...(resolutionType === undefined ? {} : { resolutionType }),
    ...(resolutionSummary === undefined ? {} : { resolutionSummary }),
    ...(customerCommunicationStatus === undefined ? {} : { customerCommunicationStatus }),
  };
}

export function toTransitionInput(
  complaintId: string,
  body: ComplaintTransitionRequestDto,
  context: {
    actorId: string | null;
    actorRole: RoleCode;
    correlationId: string | null;
    ipAddress: string | null;
    userAgent: string | null;
  },
): ApplyComplaintTransitionInput {
  return {
    complaintId,
    fromStatus: body.fromStatus,
    action: body.action,
    actorRole: context.actorRole,
    actorId: context.actorId,
    requestSource: 'STAFF_API',
    reason: body.reason ?? null,
    ...(body.resolutionType === undefined ? {} : { resolutionType: body.resolutionType }),
    ...(body.resolutionSummary === undefined ? {} : { resolutionSummary: body.resolutionSummary }),
    ...(body.customerCommunicationStatus === undefined ? {} : { customerCommunicationStatus: body.customerCommunicationStatus }),
    correlationId: context.correlationId,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  };
}

function objectBody(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw invalid('body', 'Request body must be an object.');
  }
  return body as Record<string, unknown>;
}

function enumValue<T extends Record<string, string>>(value: unknown, options: T, field: string): T[keyof T] {
  if (typeof value === 'string' && Object.values(options).includes(value)) {
    return value as T[keyof T];
  }
  throw invalid(field, `${field} is invalid.`);
}

function optionalText(value: unknown, field: string): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  if (typeof value !== 'string' || !value.trim()) {
    throw invalid(field, `${field} must be a non-empty string when provided.`);
  }
  return value.trim();
}

function invalid(field: string, message: string): AppException {
  return new AppException('VALIDATION_FAILED', 'Invalid complaint transition request', HttpStatus.BAD_REQUEST, [
    { field, code: 'INVALID', message },
  ]);
}

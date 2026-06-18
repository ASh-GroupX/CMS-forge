import { HttpStatus } from '@nestjs/common';
import { CommentVisibility } from '@prisma/client';
import { AppException } from '../../../core/http-kernel.js';
import type { CreateComplaintCommentInput, ComplaintCommentResult } from '../complaints.service.js';

export type ComplaintCommentRequestDto = {
  body: string;
  visibility: CommentVisibility;
};

export type ComplaintCommentResponseDto = {
  comment: ComplaintCommentResult;
};

export type ComplaintPublicCommentsResponseDto = {
  items: ComplaintCommentResult[];
};

export function parseComplaintCommentBody(body: unknown): ComplaintCommentRequestDto {
  const input = objectBody(body);
  return {
    body: requiredText(input.body, 'body'),
    visibility: enumValue(input.visibility, CommentVisibility, 'visibility'),
  };
}

export function toCommentInput(
  complaintId: string,
  body: ComplaintCommentRequestDto,
  context: Pick<CreateComplaintCommentInput, 'actorId' | 'correlationId' | 'ipAddress' | 'userAgent'>,
): CreateComplaintCommentInput {
  return {
    complaintId,
    body: body.body,
    visibility: body.visibility,
    actorId: context.actorId ?? null,
    correlationId: context.correlationId ?? null,
    ipAddress: context.ipAddress ?? null,
    userAgent: context.userAgent ?? null,
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

function enumValue<T extends Record<string, string>>(value: unknown, options: T, field: string): T[keyof T] {
  if (typeof value === 'string' && Object.values(options).includes(value)) {
    return value as T[keyof T];
  }
  throw invalid(field, `${field} is invalid.`);
}

function invalid(field: string, message: string): AppException {
  return new AppException('VALIDATION_FAILED', 'Invalid complaint comment request', HttpStatus.BAD_REQUEST, [
    { field, code: 'REQUIRED', message },
  ]);
}

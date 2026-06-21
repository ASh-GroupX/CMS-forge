import { HttpStatus } from '@nestjs/common';
import { CapaActionStatus } from '@prisma/client';
import { AppException } from '../../../core/http-kernel.js';

export type CreateCapaRequestDto = {
  rootCause: string;
  correctiveAction: string;
  preventiveAction: string;
  dueAt: string;
  status?: CapaActionStatus;
};

export function parseCreateCapaBody(body: unknown): CreateCapaRequestDto {
  const input = body as Partial<CreateCapaRequestDto>;
  return {
    rootCause: requiredText(input?.rootCause, 'rootCause'),
    correctiveAction: requiredText(input?.correctiveAction, 'correctiveAction'),
    preventiveAction: requiredText(input?.preventiveAction, 'preventiveAction'),
    dueAt: requiredDate(input?.dueAt, 'dueAt'),
    ...(input?.status ? { status: validStatus(input.status) } : {}),
  };
}

export function toCreateCapaInput(caseId: string, body: CreateCapaRequestDto) {
  return {
    caseId,
    correctiveAction: body.correctiveAction,
    dueAt: body.dueAt,
    preventiveAction: body.preventiveAction,
    rootCause: body.rootCause,
    status: body.status ?? CapaActionStatus.OPEN,
  };
}

function requiredText(value: unknown, field: string): string {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) throw invalid(field);
  return text;
}

function requiredDate(value: unknown, field: string): string {
  const text = requiredText(value, field);
  if (Number.isNaN(new Date(text).valueOf())) throw invalid(field);
  return text;
}

function validStatus(value: string): CapaActionStatus {
  if (!Object.values(CapaActionStatus).includes(value as CapaActionStatus)) throw invalid('status');
  return value as CapaActionStatus;
}

function invalid(field: string): AppException {
  return new AppException('VALIDATION_FAILED', 'Invalid CAPA request', HttpStatus.BAD_REQUEST, [
    { field, code: 'REQUIRED', message: `${field} is required or invalid.` },
  ]);
}

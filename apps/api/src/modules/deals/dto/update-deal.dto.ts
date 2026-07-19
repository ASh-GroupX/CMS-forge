import { HttpStatus } from '@nestjs/common';
import { AppException } from '../../../core/http-kernel.js';

export type AdvanceDealRequestDto = {
  currentHolderId: string | null;
  assignedDepartmentId?: string | null;
  stageDueAt: string;
  updateNote: string;
};

export type DealBlockerRequestDto = {
  blocker: string | null;
  updateNote: string;
};

export type DealDetailsRequestDto = {
  currentHolderId: string | null;
  assignedDepartmentId?: string | null;
  stageDueAt: string;
  updateNote: string;
};

export function parseAdvanceDealBody(body: unknown): AdvanceDealRequestDto {
  const input = objectBody(body);
  return {
    currentHolderId: text(input.currentHolderId) || null,
    ...(input.assignedDepartmentId !== undefined ? { assignedDepartmentId: text(input.assignedDepartmentId) || null } : {}),
    stageDueAt: text(input.stageDueAt),
    updateNote: requiredText(input.updateNote, 'updateNote'),
  };
}

export function parseDealBlockerBody(body: unknown): DealBlockerRequestDto {
  const input = objectBody(body);
  return { blocker: text(input.blocker) || null, updateNote: requiredText(input.updateNote, 'updateNote') };
}

export function parseDealDetailsBody(body: unknown): DealDetailsRequestDto {
  const input = objectBody(body);
  return {
    currentHolderId: text(input.currentHolderId) || null,
    ...(input.assignedDepartmentId !== undefined ? { assignedDepartmentId: text(input.assignedDepartmentId) || null } : {}),
    stageDueAt: requiredText(input.stageDueAt, 'stageDueAt'),
    updateNote: requiredText(input.updateNote, 'updateNote'),
  };
}

function objectBody(body: unknown): Record<string, unknown> {
  return body && typeof body === 'object' && !Array.isArray(body) ? body as Record<string, unknown> : {};
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function requiredText(value: unknown, field: string): string {
  const parsed = text(value);
  if (!parsed) throw new AppException('VALIDATION_FAILED', 'Invalid deal update request', HttpStatus.BAD_REQUEST, [{ field, code: 'REQUIRED', message: `${field} is required.` }]);
  return parsed;
}

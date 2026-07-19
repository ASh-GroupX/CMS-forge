import { HttpStatus } from '@nestjs/common';
import { AppException } from '../../../core/http-kernel.js';

export type UpdateCaseAssignmentDto = {
  assignedUserId: string | null;
  assignedDepartmentId: string | null;
  reason?: string | null;
};

export function parseCaseAssignmentBody(body: unknown): UpdateCaseAssignmentDto {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw invalid('body');
  const input = body as Record<string, unknown>;
  const assignedUserId = optional(input.assignedUserId, 'assignedUserId');
  const assignedDepartmentId = optional(input.assignedDepartmentId, 'assignedDepartmentId');
  if (!assignedUserId && !assignedDepartmentId) throw invalid('assignment');
  const reason = optional(input.reason, 'reason');
  return { assignedUserId, assignedDepartmentId, ...(reason ? { reason } : {}) };
}

function optional(value: unknown, field: string): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'string' && value.trim()) return value.trim();
  throw invalid(field);
}

function invalid(field: string): AppException {
  return new AppException('VALIDATION_FAILED', 'Invalid case assignment', HttpStatus.BAD_REQUEST, [
    { field, code: 'REQUIRED', message: `${field} is required or invalid.` },
  ]);
}

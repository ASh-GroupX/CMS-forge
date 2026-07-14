import { HttpStatus } from '@nestjs/common';
import { BoardScope, ComplaintStatus, TaskStatus } from '@prisma/client';
import { AppException } from '../../../core/http-kernel.js';
import type { CreateBoardStageData, UpdateBoardStageData } from '../board-stages.repository.js';

// Stage colors are the token names the boards render (globals.css --stage-*).
export const STAGE_COLORS = ['slate', 'blue', 'amber', 'green', 'red', 'violet'] as const;

export function parseCreateBoardStageBody(body: unknown): CreateBoardStageData {
  const input = objectBody(body);
  const scope = scopeValue(input.scope);
  const data: CreateBoardStageData = {
    code: requiredText(input.code, 'code').toUpperCase(),
    scope,
    nameEn: requiredText(input.nameEn, 'nameEn'),
    nameAr: requiredText(input.nameAr, 'nameAr'),
    color: colorValue(input.color),
  };
  if (scope === BoardScope.TICKETS) {
    if (input.mappedTaskStatus !== undefined) throw invalid('mappedTaskStatus', 'mappedTaskStatus is only valid for TASKS stages.');
    data.mappedComplaintStatus = enumValue(input.mappedComplaintStatus, Object.values(ComplaintStatus), 'mappedComplaintStatus');
  } else {
    if (input.mappedComplaintStatus !== undefined) throw invalid('mappedComplaintStatus', 'mappedComplaintStatus is only valid for TICKETS stages.');
    if (input.mappedTaskStatus !== undefined) data.mappedTaskStatus = enumValue(input.mappedTaskStatus, Object.values(TaskStatus), 'mappedTaskStatus');
  }
  return data;
}

export function parseUpdateBoardStageBody(body: unknown): UpdateBoardStageData {
  const input = objectBody(body);
  const data: UpdateBoardStageData = {};
  if (input.nameEn !== undefined) data.nameEn = requiredText(input.nameEn, 'nameEn');
  if (input.nameAr !== undefined) data.nameAr = requiredText(input.nameAr, 'nameAr');
  if (input.color !== undefined) data.color = colorValue(input.color);
  if (Object.keys(data).length === 0) throw invalid('body', 'At least one of nameEn, nameAr, or color is required.');
  return data;
}

export function parseReorderBoardStagesBody(body: unknown): { scope: BoardScope; orderedIds: string[] } {
  const input = objectBody(body);
  const scope = scopeValue(input.scope);
  if (!Array.isArray(input.orderedIds) || input.orderedIds.length === 0) {
    throw invalid('orderedIds', 'orderedIds must be a non-empty array of stage ids.');
  }
  const orderedIds = input.orderedIds.map((id, index) => requiredText(id, `orderedIds[${index}]`));
  if (new Set(orderedIds).size !== orderedIds.length) throw invalid('orderedIds', 'orderedIds must not contain duplicates.');
  return { scope, orderedIds };
}

export function parseArchiveBoardStageBody(body: unknown): { destinationStageId: string } {
  const input = objectBody(body);
  return { destinationStageId: requiredText(input.destinationStageId, 'destinationStageId') };
}

function scopeValue(value: unknown): BoardScope {
  return enumValue(value, Object.values(BoardScope), 'scope');
}

function colorValue(value: unknown): string {
  return enumValue(value, STAGE_COLORS, 'color');
}

function enumValue<T extends string>(value: unknown, allowed: readonly T[], field: string): T {
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    throw invalid(field, `${field} must be one of: ${allowed.join(', ')}.`);
  }
  return value as T;
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

function invalid(field: string, message: string): AppException {
  return new AppException('VALIDATION_FAILED', 'Invalid board stage request', HttpStatus.BAD_REQUEST, [
    { field, code: 'REQUIRED', message },
  ]);
}

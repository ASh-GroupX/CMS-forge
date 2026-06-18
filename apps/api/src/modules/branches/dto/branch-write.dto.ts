import { HttpStatus } from '@nestjs/common';
import { AppException } from '../../../core/http-kernel.js';
import type { CreateBranchData, UpdateBranchData } from '../branches.repository.js';

export function parseCreateBranchBody(body: unknown): CreateBranchData {
  const input = objectBody(body);
  const data = {
    code: requiredText(input.code, 'code'),
    nameEn: requiredText(input.nameEn, 'nameEn'),
    nameAr: requiredText(input.nameAr, 'nameAr'),
  };
  const timezone = optionalText(input.timezone, 'timezone');
  return timezone ? { ...data, timezone } : data;
}

export function parseUpdateBranchBody(body: unknown): UpdateBranchData {
  const input = objectBody(body);
  const data: UpdateBranchData = {};

  for (const field of ['code', 'nameEn', 'nameAr', 'timezone'] as const) {
    if (input[field] !== undefined) {
      data[field] = requiredText(input[field], field);
    }
  }

  if (Object.keys(data).length === 0) {
    throw invalid('body', 'At least one branch field is required.');
  }

  return data;
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

function optionalText(value: unknown, field: string): string | undefined {
  return value === undefined ? undefined : requiredText(value, field);
}

function invalid(field: string, message: string): AppException {
  return new AppException('VALIDATION_FAILED', 'Invalid branch request', HttpStatus.BAD_REQUEST, [
    { field, code: 'REQUIRED', message },
  ]);
}

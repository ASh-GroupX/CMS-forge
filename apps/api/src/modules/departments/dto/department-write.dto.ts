import { HttpStatus } from '@nestjs/common';
import { AppException } from '../../../core/http-kernel.js';
import type { CreateDepartmentData, UpdateDepartmentData } from '../departments.repository.js';

export function parseCreateDepartmentBody(body: unknown): CreateDepartmentData {
  const input = objectBody(body);
  const data = {
    code: requiredText(input.code, 'code'),
    nameEn: requiredText(input.nameEn, 'nameEn'),
    nameAr: requiredText(input.nameAr, 'nameAr'),
    branchId: optionalTextOrNull(input.branchId, 'branchId'),
  };
  return data;
}

export function parseUpdateDepartmentBody(body: unknown): UpdateDepartmentData {
  const input = objectBody(body);
  const data: UpdateDepartmentData = {};

  for (const field of ['code', 'nameEn', 'nameAr'] as const) {
    if (input[field] !== undefined) {
      data[field] = requiredText(input[field], field);
    }
  }

  if (input.branchId !== undefined) {
    data.branchId = optionalTextOrNull(input.branchId, 'branchId');
  }

  if (Object.keys(data).length === 0) {
    throw invalid('body', 'At least one department field is required.');
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

function optionalTextOrNull(value: unknown, field: string): string | null {
  return value === undefined || value === null || value === '' ? null : requiredText(value, field);
}

function optionalText(value: unknown, field: string): string | undefined {
  return value === undefined ? undefined : requiredText(value, field);
}

function invalid(field: string, message: string): AppException {
  return new AppException('VALIDATION_FAILED', 'Invalid department request', HttpStatus.BAD_REQUEST, [
    { field, code: 'REQUIRED', message },
  ]);
}

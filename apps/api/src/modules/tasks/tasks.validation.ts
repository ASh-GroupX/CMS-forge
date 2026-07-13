import { HttpStatus } from '@nestjs/common';
import { AppException } from '../../core/http-kernel.js';

export function requiredText(value: string, field: string): string {
  const text = value.trim();
  if (!text) throw invalid(field);
  return text;
}

export function validDate(value: Date | string, field: string): Date {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.valueOf())) throw invalid(field);
  return date;
}

export function validEnum<T extends Record<string, string>>(value: string, options: T, field: string): T[keyof T] {
  if (!Object.values(options).includes(value)) throw invalid(field);
  return value as T[keyof T];
}

export function utcDay(value: Date): [Date, Date] {
  const start = new Date(value);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return [start, end];
}

function invalid(field: string): AppException {
  return new AppException('VALIDATION_FAILED', 'Invalid task request', HttpStatus.BAD_REQUEST, [{ field, code: 'REQUIRED', message: `${field} is required or invalid.` }]);
}

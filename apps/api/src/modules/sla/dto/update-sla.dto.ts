import { HttpStatus } from '@nestjs/common';
import { WorkingCalendarMode } from '@prisma/client';
import { AppException } from '../../../core/http-kernel.js';

export class UpdateSlaDto {}

export type SlaPolicyEscalationConfigInput = {
  escalationLevel1: string;
  escalationLevel2: string | null;
  escalationLevel3: string | null;
  escalationLevel2AfterBreachMinutes: number | null;
  escalationLevel3AfterBreachMinutes: number | null;
};

export type SlaPolicyConfigInput = SlaPolicyEscalationConfigInput & {
  durationMinutes: number;
  warningPercent: number;
  branchTimezone: string;
  workingCalendarMode: WorkingCalendarMode;
};

type FieldError = { field: string; code: 'REQUIRED' | 'INVALID'; message: string };

export function parseUpdateSlaEscalationConfigBody(body: unknown): SlaPolicyEscalationConfigInput {
  const source = objectBody(body);
  return escalationConfig(source, 'Invalid SLA policy escalation request');
}

export function parseUpdateSlaPolicyConfigBody(body: unknown): SlaPolicyConfigInput {
  const source = objectBody(body);
  const errors: FieldError[] = [];
  const durationMinutes = positiveInt(source.durationMinutes, 'durationMinutes', errors);
  const warningPercent = percent(source.warningPercent, 'warningPercent', errors);
  const branchTimezone = timezone(source.branchTimezone, errors);
  const workingCalendarMode = calendarMode(source.workingCalendarMode, errors);
  const escalation = escalationConfig(source, 'Invalid SLA policy request', errors);

  if (errors.length) throw validation('Invalid SLA policy request', errors);
  return { durationMinutes, warningPercent, branchTimezone, workingCalendarMode, ...escalation };
}

function escalationConfig(source: Record<string, unknown>, message: string, existingErrors: FieldError[] = []): SlaPolicyEscalationConfigInput {
  const errors: FieldError[] = [];
  const invalid = new Set<string>();
  const add = (field: string, code: FieldError['code'], message: string) => {
    invalid.add(field);
    errors.push({ field, code, message });
  };

  const escalationLevel1 = requiredText(source.escalationLevel1, 'escalationLevel1', add);
  const escalationLevel2 = optionalText(source.escalationLevel2, 'escalationLevel2', add);
  const escalationLevel3 = optionalText(source.escalationLevel3, 'escalationLevel3', add);
  const escalationLevel2AfterBreachMinutes = optionalPositiveInt(source.escalationLevel2AfterBreachMinutes, 'escalationLevel2AfterBreachMinutes', add);
  const escalationLevel3AfterBreachMinutes = optionalPositiveInt(source.escalationLevel3AfterBreachMinutes, 'escalationLevel3AfterBreachMinutes', add);

  if (!invalid.has('escalationLevel2') && !invalid.has('escalationLevel2AfterBreachMinutes')) {
    if (escalationLevel2 && escalationLevel2AfterBreachMinutes === null) add('escalationLevel2AfterBreachMinutes', 'REQUIRED', 'escalationLevel2AfterBreachMinutes is required when escalationLevel2 is set.');
    if (!escalationLevel2 && escalationLevel2AfterBreachMinutes !== null) add('escalationLevel2', 'REQUIRED', 'escalationLevel2 is required when escalationLevel2AfterBreachMinutes is set.');
  }
  if (!invalid.has('escalationLevel3') && !invalid.has('escalationLevel3AfterBreachMinutes')) {
    if (escalationLevel3 && escalationLevel3AfterBreachMinutes === null) add('escalationLevel3AfterBreachMinutes', 'REQUIRED', 'escalationLevel3AfterBreachMinutes is required when escalationLevel3 is set.');
    if (!escalationLevel3 && escalationLevel3AfterBreachMinutes !== null) add('escalationLevel3', 'REQUIRED', 'escalationLevel3 is required when escalationLevel3AfterBreachMinutes is set.');
  }
  if (escalationLevel2AfterBreachMinutes !== null && escalationLevel3AfterBreachMinutes !== null && escalationLevel3AfterBreachMinutes <= escalationLevel2AfterBreachMinutes) {
    add('escalationLevel3AfterBreachMinutes', 'INVALID', 'escalationLevel3AfterBreachMinutes must be greater than escalationLevel2AfterBreachMinutes.');
  }
  existingErrors.push(...errors);
  if (errors.length && existingErrors.length === errors.length) throw validation(message, errors);

  return { escalationLevel1, escalationLevel2, escalationLevel3, escalationLevel2AfterBreachMinutes, escalationLevel3AfterBreachMinutes };
}

function objectBody(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw validation('Invalid SLA policy request', [{ field: 'body', code: 'REQUIRED', message: 'Request body is required.' }]);
  return body as Record<string, unknown>;
}

function requiredText(value: unknown, field: string, add: (field: string, code: FieldError['code'], message: string) => void): string {
  if (typeof value !== 'string') {
    add(field, 'REQUIRED', `${field} is required.`);
    return '';
  }
  const text = value.trim();
  if (!text) add(field, 'REQUIRED', `${field} is required.`);
  return text;
}

function optionalText(value: unknown, field: string, add: (field: string, code: FieldError['code'], message: string) => void): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') {
    add(field, 'INVALID', `${field} must be a string or null.`);
    return null;
  }
  return value.trim() || null;
}

function optionalPositiveInt(value: unknown, field: string, add: (field: string, code: FieldError['code'], message: string) => void): number | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    add(field, 'INVALID', `${field} must be a positive integer or null.`);
    return null;
  }
  return value;
}

function positiveInt(value: unknown, field: string, errors: FieldError[]): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    errors.push({ field, code: 'INVALID', message: `${field} must be a positive integer.` });
    return 1;
  }
  return value;
}

function percent(value: unknown, field: string, errors: FieldError[]): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > 100) {
    errors.push({ field, code: 'INVALID', message: `${field} must be an integer from 1 to 100.` });
    return 80;
  }
  return value;
}

function timezone(value: unknown, errors: FieldError[]): string {
  const text = typeof value === 'string' ? value.trim() : '';
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: text }).format(new Date('2026-01-01T00:00:00.000Z'));
  } catch {
    errors.push({ field: 'branchTimezone', code: 'INVALID', message: 'branchTimezone must be a valid IANA timezone.' });
  }
  return text || 'UTC';
}

function calendarMode(value: unknown, errors: FieldError[]): WorkingCalendarMode {
  if (value === WorkingCalendarMode.ALWAYS_ON || value === WorkingCalendarMode.CALENDAR_HOURS) return value;
  errors.push({ field: 'workingCalendarMode', code: 'INVALID', message: 'workingCalendarMode is invalid.' });
  return WorkingCalendarMode.ALWAYS_ON;
}

function validation(message: string, fieldErrors: FieldError[]): AppException {
  return new AppException('VALIDATION_FAILED', message, HttpStatus.BAD_REQUEST, fieldErrors);
}

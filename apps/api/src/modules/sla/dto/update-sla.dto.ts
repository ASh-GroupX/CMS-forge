import { HttpStatus } from '@nestjs/common';
import { AppException } from '../../../core/http-kernel.js';

export class UpdateSlaDto {}

export type SlaPolicyEscalationConfigInput = {
  escalationLevel1: string;
  escalationLevel2: string | null;
  escalationLevel3: string | null;
  escalationLevel2AfterBreachMinutes: number | null;
  escalationLevel3AfterBreachMinutes: number | null;
};

type FieldError = { field: string; code: 'REQUIRED' | 'INVALID'; message: string };

export function parseUpdateSlaEscalationConfigBody(body: unknown): SlaPolicyEscalationConfigInput {
  const source = objectBody(body);
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
  if (errors.length) throw validation(errors);

  return { escalationLevel1, escalationLevel2, escalationLevel3, escalationLevel2AfterBreachMinutes, escalationLevel3AfterBreachMinutes };
}

function objectBody(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw validation([{ field: 'body', code: 'REQUIRED', message: 'Request body is required.' }]);
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

function validation(fieldErrors: FieldError[]): AppException {
  return new AppException('VALIDATION_FAILED', 'Invalid SLA policy escalation request', HttpStatus.BAD_REQUEST, fieldErrors);
}

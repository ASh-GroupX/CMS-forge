import { HttpStatus } from '@nestjs/common';
import { TaskStatus } from '@prisma/client';
import { AppException } from '../../../core/http-kernel.js';
import type { TaskNextActionInput, UpdateTaskInput } from '../tasks.service.js';

export function parseUpdateTaskBody(taskId: string, body: unknown): UpdateTaskInput {
  const input = objectBody(body);
  const result: UpdateTaskInput = { taskId: requiredText(taskId, 'taskId') };

  if (input.status !== undefined) result.status = enumValue(input.status, TaskStatus, 'status');
  if (input.assigneeId !== undefined) result.assigneeId = requiredText(input.assigneeId, 'assigneeId');
  if (input.dueAt !== undefined) result.dueAt = requiredText(input.dueAt, 'dueAt');
  if (input.isCustomerPromise !== undefined) result.isCustomerPromise = booleanValue(input.isCustomerPromise, 'isCustomerPromise');
  if (input.nextAction !== undefined) result.nextAction = nextActionValue(input.nextAction);

  if (Object.keys(result).length === 1) throw invalid('body', 'At least one task field is required.');
  return result;
}

function nextActionValue(value: unknown): TaskNextActionInput | null {
  if (value === null) return null;
  const input = objectBody(value);
  return {
    what: requiredText(input.what, 'nextAction.what'),
    whoId: requiredText(input.whoId, 'nextAction.whoId'),
    when: requiredText(input.when, 'nextAction.when'),
  };
}

function objectBody(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw invalid('body', 'Request body must be an object.');
  return body as Record<string, unknown>;
}

function requiredText(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) throw invalid(field, `${field} is required.`);
  return value.trim();
}

function booleanValue(value: unknown, field: string): boolean {
  if (typeof value !== 'boolean') throw invalid(field, `${field} must be a boolean.`);
  return value;
}

function enumValue<T extends Record<string, string>>(value: unknown, options: T, field: string): T[keyof T] {
  if (typeof value === 'string' && Object.values(options).includes(value)) return value as T[keyof T];
  throw invalid(field, `${field} is invalid.`);
}

function invalid(field: string, message: string): AppException {
  return new AppException('VALIDATION_FAILED', 'Invalid task request', HttpStatus.BAD_REQUEST, [
    { field, code: 'REQUIRED', message },
  ]);
}

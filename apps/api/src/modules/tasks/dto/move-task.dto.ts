import { HttpStatus } from '@nestjs/common';
import { AppException } from '../../../core/http-kernel.js';
import type { MoveTaskInput } from '../tasks.board.service.js';
import type { TaskNextActionInput } from '../tasks.service.js';

export function parseMoveTaskBody(taskId: string, body: unknown): MoveTaskInput {
  const input = objectBody(body);
  const result: MoveTaskInput = {
    taskId: requiredText(taskId, 'taskId'),
    stageId: requiredText(input.stageId, 'stageId'),
    boardPosition: integerValue(input.boardPosition, 'boardPosition'),
  };
  if (input.statusNote !== undefined) result.statusNote = requiredText(input.statusNote, 'statusNote');
  if (input.nextAction !== undefined) result.nextAction = nextActionValue(input.nextAction);
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

function integerValue(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) throw invalid(field, `${field} must be a non-negative integer.`);
  return value;
}

function invalid(field: string, message: string): AppException {
  return new AppException('VALIDATION_FAILED', 'Invalid task move request', HttpStatus.BAD_REQUEST, [
    { field, code: 'REQUIRED', message },
  ]);
}

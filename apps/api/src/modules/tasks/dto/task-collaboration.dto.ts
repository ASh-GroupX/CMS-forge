import { HttpStatus } from '@nestjs/common';
import { AppException } from '../../../core/http-kernel.js';

export type CreateTaskCommentInput = { body: string };
export type TaskNudgeInput = { message?: string; recipientUserId?: string };

export function parseTaskCommentBody(body: unknown): CreateTaskCommentInput {
  if (!isRecord(body)) throw invalid('body');
  return { body: limitedText(body.body, 'body', 2000) };
}

export function parseTaskNudgeBody(body: unknown): TaskNudgeInput {
  if (body === undefined || body === null) return {};
  if (!isRecord(body)) throw invalid('body');
  return {
    ...(body.message === undefined ? {} : { message: limitedText(body.message, 'message', 240) }),
    ...(body.recipientUserId === undefined ? {} : { recipientUserId: limitedText(body.recipientUserId, 'recipientUserId', 120) }),
  };
}

function limitedText(value: unknown, field: string, max: number): string {
  if (typeof value !== 'string') throw invalid(field);
  const text = value.trim();
  if (!text || text.length > max) throw invalid(field);
  return text;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function invalid(field: string): AppException {
  return new AppException('VALIDATION_FAILED', 'Invalid task collaboration request', HttpStatus.BAD_REQUEST, [
    { field, code: 'REQUIRED', message: `${field} is required or invalid.` },
  ]);
}

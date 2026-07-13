import { HttpStatus } from '@nestjs/common';
import { CommentVisibility } from '@prisma/client';
import { AppException } from '../../../core/http-kernel.js';
import type { CreateComplaintCommentInput, ComplaintCommentResult } from '../complaints.service.js';

export type ComplaintMentionTarget = { type: 'USER' | 'SYSTEM_ROLE' | 'SYSTEM_DEPARTMENT' | 'CUSTOM_GROUP'; id: string };
export type ComplaintCommentRequestDto = {
  body: string;
  visibility: CommentVisibility;
  mentionTargets: ComplaintMentionTarget[];
  ccUserIds: string[];
  confirmedRecipientCount?: number;
  actionTask?: { title: string; assigneeId: string; dueAt: string };
};

export type ComplaintCommentResponseDto = {
  comment: ComplaintCommentResult;
};

export type ComplaintCommentsResponseDto = {
  items: ComplaintCommentResult[];
};

export type ComplaintPublicCommentsResponseDto = {
  items: ComplaintCommentResult[];
};

export function parseComplaintCommentBody(body: unknown): ComplaintCommentRequestDto {
  const input = objectBody(body);
  return {
    body: requiredText(input.body, 'body'),
    visibility: enumValue(input.visibility, CommentVisibility, 'visibility'),
    mentionTargets: mentionTargets(input.mentionTargets),
    ccUserIds: userIds(input.ccUserIds),
    ...(input.confirmedRecipientCount === undefined ? {} : { confirmedRecipientCount: positiveInteger(input.confirmedRecipientCount, 'confirmedRecipientCount') }),
    ...(input.actionTask === undefined ? {} : { actionTask: actionTask(input.actionTask) }),
  };
}

export function toCommentInput(
  complaintId: string,
  body: ComplaintCommentRequestDto,
  context: Pick<CreateComplaintCommentInput, 'actorId' | 'actorRole' | 'actorBranchId' | 'actorPermissions' | 'correlationId' | 'ipAddress' | 'userAgent'>,
): CreateComplaintCommentInput {
  return {
    complaintId,
    body: body.body,
    visibility: body.visibility,
    ...(body.mentionTargets.length ? { mentionTargets: body.mentionTargets } : {}),
    ...(body.ccUserIds.length ? { ccUserIds: body.ccUserIds } : {}),
    ...(body.confirmedRecipientCount === undefined ? {} : { confirmedRecipientCount: body.confirmedRecipientCount }),
    ...(body.actionTask === undefined ? {} : { actionTask: body.actionTask }),
    actorId: context.actorId ?? null,
    ...(body.visibility === CommentVisibility.INTERNAL ? { actorRole: context.actorRole ?? null, actorBranchId: context.actorBranchId ?? null, actorPermissions: context.actorPermissions ?? [] } : {}),
    correlationId: context.correlationId ?? null,
    ipAddress: context.ipAddress ?? null,
    userAgent: context.userAgent ?? null,
  };
}

function mentionTargets(value: unknown): ComplaintMentionTarget[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 20) throw invalid('mentionTargets', 'mentionTargets is invalid.');
  return value.map((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) throw invalid('mentionTargets', 'mentionTargets is invalid.');
    const target = item as Record<string, unknown>;
    if (!['USER', 'SYSTEM_ROLE', 'SYSTEM_DEPARTMENT', 'CUSTOM_GROUP'].includes(String(target.type))) throw invalid('mentionTargets', 'mentionTargets is invalid.');
    return { type: target.type as ComplaintMentionTarget['type'], id: limitedText(target.id, 'mentionTargets.id', 120) };
  });
}

function userIds(value: unknown): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 100) throw invalid('ccUserIds', 'ccUserIds is invalid.');
  return [...new Set(value.map((item) => limitedText(item, 'ccUserIds', 120)))];
}

function actionTask(value: unknown): { title: string; assigneeId: string; dueAt: string } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw invalid('actionTask', 'actionTask is invalid.');
  const input = value as Record<string, unknown>;
  const dueAt = limitedText(input.dueAt, 'actionTask.dueAt', 64);
  if (Number.isNaN(new Date(dueAt).getTime())) throw invalid('actionTask.dueAt', 'actionTask.dueAt is invalid.');
  return { title: limitedText(input.title, 'actionTask.title', 240), assigneeId: limitedText(input.assigneeId, 'actionTask.assigneeId', 120), dueAt };
}

function positiveInteger(value: unknown, field: string): number {
  if (!Number.isInteger(value) || Number(value) < 1 || Number(value) > 100) throw invalid(field, `${field} is invalid.`);
  return Number(value);
}

function limitedText(value: unknown, field: string, max: number): string {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) throw invalid(field, `${field} is invalid.`);
  return value.trim();
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

function enumValue<T extends Record<string, string>>(value: unknown, options: T, field: string): T[keyof T] {
  if (typeof value === 'string' && Object.values(options).includes(value)) {
    return value as T[keyof T];
  }
  throw invalid(field, `${field} is invalid.`);
}

function invalid(field: string, message: string): AppException {
  return new AppException('VALIDATION_FAILED', 'Invalid complaint comment request', HttpStatus.BAD_REQUEST, [
    { field, code: 'REQUIRED', message },
  ]);
}

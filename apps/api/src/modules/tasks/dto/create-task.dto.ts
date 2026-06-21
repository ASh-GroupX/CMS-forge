import { HttpStatus } from '@nestjs/common';
import { TaskConfidentialityLevel, TaskLinkEntityType, TaskVisibility } from '@prisma/client';
import { AppException } from '../../../core/http-kernel.js';
import type { CreateTaskInput } from '../tasks.service.js';
import type { TaskResponseDto } from './task-response.dto.js';

export type QuickAddTaskRequestDto = {
  title: string;
  what: string;
  whoId: string;
  when: string;
  dueAt?: string;
  isCustomerPromise?: boolean;
  links?: { entityType: TaskLinkEntityType; entityId: string }[];
  participantUserIds?: string[];
  visibility?: TaskVisibility;
  confidentialityLevel?: TaskConfidentialityLevel;
};

export type QuickAddTaskResponseDto = {
  task: TaskResponseDto;
};

export function parseQuickAddTaskBody(body: unknown): QuickAddTaskRequestDto {
  const input = objectBody(body);
  rejectClientAuthority(input);
  const result: QuickAddTaskRequestDto = {
    title: requiredText(input.title, 'title'),
    what: requiredText(input.what, 'what'),
    whoId: requiredText(input.whoId, 'whoId'),
    when: requiredText(input.when, 'when'),
  };
  const dueAt = optionalText(input.dueAt, 'dueAt');
  const links = optionalLinks(input.links);
  const isCustomerPromise = optionalBoolean(input.isCustomerPromise, 'isCustomerPromise');
  const participantUserIds = optionalStringArray(input.participantUserIds, 'participantUserIds');
  const visibility = optionalEnum(input.visibility, TaskVisibility, 'visibility');
  const confidentialityLevel = optionalEnum(input.confidentialityLevel, TaskConfidentialityLevel, 'confidentialityLevel');
  if (dueAt !== undefined) result.dueAt = dueAt;
  if (isCustomerPromise !== undefined) result.isCustomerPromise = isCustomerPromise;
  if (links !== undefined) result.links = links;
  if (participantUserIds !== undefined) result.participantUserIds = participantUserIds;
  if (visibility !== undefined) result.visibility = visibility;
  if (confidentialityLevel !== undefined) result.confidentialityLevel = confidentialityLevel;
  return result;
}

export function toQuickAddTaskInput(body: QuickAddTaskRequestDto, ownerId: string): CreateTaskInput {
  const input: CreateTaskInput = {
    title: body.title,
    ownerId,
    assigneeId: body.whoId,
    dueAt: body.dueAt ?? body.when,
    nextAction: { what: body.what, whoId: body.whoId, when: body.when },
  };
  if (body.links !== undefined) input.links = body.links;
  if (body.isCustomerPromise !== undefined) input.isCustomerPromise = body.isCustomerPromise;
  if (body.participantUserIds !== undefined) input.participantUserIds = body.participantUserIds;
  if (body.visibility !== undefined) input.visibility = body.visibility;
  if (body.confidentialityLevel !== undefined) input.confidentialityLevel = body.confidentialityLevel;
  return input;
}

function objectBody(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw invalid('body', 'Request body must be an object.');
  }
  return body as Record<string, unknown>;
}

function rejectClientAuthority(input: Record<string, unknown>): void {
  for (const field of ['ownerId', 'assigneeId', 'status', 'nextAction']) {
    if (input[field] !== undefined) throw invalid(field, `${field} is server-owned.`);
  }
}

function requiredText(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) throw invalid(field, `${field} is required.`);
  return value.trim();
}

function optionalText(value: unknown, field: string): string | undefined {
  return value === undefined ? undefined : requiredText(value, field);
}

function optionalStringArray(value: unknown, field: string): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) throw invalid(field, `${field} must be an array.`);
  return value.map((item, index) => requiredText(item, `${field}.${index}`));
}

function optionalBoolean(value: unknown, field: string): boolean | undefined {
  if (value === undefined) return undefined;
  if (typeof value === 'boolean') return value;
  throw invalid(field, `${field} must be a boolean.`);
}

function optionalLinks(value: unknown): QuickAddTaskRequestDto['links'] {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) throw invalid('links', 'links must be an array.');
  return value.map((item, index) => {
    const link = objectBody(item);
    return {
      entityType: enumValue(link.entityType, TaskLinkEntityType, `links.${index}.entityType`),
      entityId: requiredText(link.entityId, `links.${index}.entityId`),
    };
  });
}

function optionalEnum<T extends Record<string, string>>(value: unknown, options: T, field: string): T[keyof T] | undefined {
  return value === undefined ? undefined : enumValue(value, options, field);
}

function enumValue<T extends Record<string, string>>(value: unknown, options: T, field: string): T[keyof T] {
  if (typeof value === 'string' && Object.values(options).includes(value)) return value as T[keyof T];
  throw invalid(field, `${field} is invalid.`);
}

function invalid(field: string, message: string): AppException {
  return new AppException('VALIDATION_FAILED', 'Invalid quick-add task request', HttpStatus.BAD_REQUEST, [
    { field, code: 'REQUIRED', message },
  ]);
}

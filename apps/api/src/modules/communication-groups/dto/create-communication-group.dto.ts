import { CommunicationGroupVisibility } from '@prisma/client';
import { AppException } from '../../../core/http-kernel.js';

export type CommunicationGroupWriteDto = {
  name: string;
  visibility: CommunicationGroupVisibility;
  memberUserIds: string[];
};

export function parseCreateCommunicationGroupBody(body: unknown): CommunicationGroupWriteDto {
  const input = objectBody(body);
  return {
    name: text(input.name, 'name', 80),
    visibility: visibility(input.visibility),
    memberUserIds: userIds(input.memberUserIds),
  };
}

function objectBody(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw invalid('body');
  return value as Record<string, unknown>;
}

function text(value: unknown, field: string, max: number): string {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) throw invalid(field);
  return value.trim();
}

function visibility(value: unknown): CommunicationGroupVisibility {
  if (value === undefined) return CommunicationGroupVisibility.PERSONAL;
  if (value === CommunicationGroupVisibility.PERSONAL || value === CommunicationGroupVisibility.SHARED) return value;
  throw invalid('visibility');
}

function userIds(value: unknown): string[] {
  if (!Array.isArray(value) || value.length > 100) throw invalid('memberUserIds');
  const ids = [...new Set(value.map((item) => text(item, 'memberUserIds', 120)))];
  if (ids.length !== value.length) throw invalid('memberUserIds');
  return ids;
}

function invalid(field: string): AppException {
  return new AppException('VALIDATION_FAILED', 'Invalid communication group request', 400, [{ field, code: 'REQUIRED', message: `${field} is required or invalid.` }]);
}

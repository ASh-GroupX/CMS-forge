import type { AuditEventType, Prisma } from '@prisma/client';
import type { StaffPrincipal } from '../../core/auth.guard.js';
import { AppException } from '../../core/http-kernel.js';
import { AuditRepository } from './audit.repository.js';
import type { AuditSearchFilters } from './audit.repository.js';

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;
const AUDIT_EVENT_TYPES: AuditEventType[] = [
  'AUTH',
  'USER_ADMIN',
  'COMPLAINT',
  'WORKFLOW',
  'COMMENT',
  'ATTACHMENT',
  'SLA',
  'NOTIFICATION',
  'REPORT',
  'CONFIG',
  'SECURITY',
];

export type AuditSearchInput = AuditSearchFilters & {
  page?: number;
  pageSize?: number;
};

export type AuditSearchResult = {
  items: AuditLogResponse[];
  page: number;
  pageSize: number;
};

type AuditLogRow = Prisma.AuditLogGetPayload<Record<string, never>>;

type AuditLogResponse = {
  id: string;
  eventType: AuditEventType;
  action: string;
  actorId: string | null;
  branchId: string | null;
  targetType: string;
  targetId: string | null;
  correlationId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: unknown;
  createdAt: string;
};

export class AuditSearchService {
  constructor(private readonly repository: AuditRepository) {}

  async search(input: AuditSearchInput, principal: StaffPrincipal): Promise<AuditSearchResult> {
    const page = clamp(input.page ?? 1, 1, Number.MAX_SAFE_INTEGER);
    const pageSize = clamp(input.pageSize ?? DEFAULT_PAGE_SIZE, 1, MAX_PAGE_SIZE);
    const branchId = principal.roleCode === 'ADMIN' ? input.branchId : principal.branchId;

    if (principal.roleCode !== 'ADMIN' && input.branchId && input.branchId !== principal.branchId) {
      throw new AppException('BRANCH_SCOPE_FORBIDDEN', 'Forbidden', 403);
    }

    const { page: _page, pageSize: _pageSize, ...filters } = input;
    if (branchId) {
      filters.branchId = branchId;
    } else {
      delete filters.branchId;
    }

    const items = await this.repository.search(filters, { page, pageSize });
    return { items: items.map(toResponse), page, pageSize };
  }
}

export function parseAuditSearchQuery(query: Record<string, unknown>): AuditSearchInput {
  const eventType = optionalString(query.eventType, 'eventType');
  if (eventType && !AUDIT_EVENT_TYPES.includes(eventType as AuditEventType)) {
    throw invalidQuery('eventType');
  }

  const parsed: AuditSearchInput = {};
  const fields = {
    actorId: optionalString(query.actorId, 'actorId'),
    branchId: optionalString(query.branchId, 'branchId'),
    targetType: optionalString(query.targetType, 'targetType'),
    targetId: optionalString(query.targetId, 'targetId'),
    correlationId: optionalString(query.correlationId, 'correlationId'),
    from: optionalDate(query.from, 'from'),
    to: optionalDate(query.to, 'to'),
    page: optionalInt(query.page, 'page'),
    pageSize: optionalInt(query.pageSize, 'pageSize'),
  };
  if (eventType) parsed.eventType = eventType as AuditEventType;
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) {
      Object.assign(parsed, { [key]: value });
    }
  }
  return parsed;
}

function toResponse(row: AuditLogRow): AuditLogResponse {
  return {
    id: row.id,
    eventType: row.eventType,
    action: row.action,
    actorId: row.actorId,
    branchId: row.branchId,
    targetType: row.targetType,
    targetId: row.targetId,
    correlationId: row.correlationId,
    ipAddress: row.ipAddress,
    userAgent: row.userAgent,
    metadata: redact(row.metadata),
    createdAt: row.createdAt.toISOString(),
  };
}

function optionalString(value: unknown, field: string): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== 'string' || value.trim() === '') {
    throw invalidQuery(field);
  }
  return value.trim();
}

function optionalInt(value: unknown, field: string): number | undefined {
  if (value === undefined) {
    return undefined;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw invalidQuery(field);
  }
  return parsed;
}

function optionalDate(value: unknown, field: string): Date | undefined {
  const text = optionalString(value, field);
  if (!text) {
    return undefined;
  }
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) {
    throw invalidQuery(field);
  }
  return date;
}

function invalidQuery(field: string): AppException {
  return new AppException('VALIDATION_FAILED', `Invalid audit search query: ${field}`, 400);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function redact(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redact);
  }
  if (!value || typeof value !== 'object') {
    return value;
  }
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      /password|token|otp|secret|credential|hash/i.test(key) ? '[REDACTED]' : redact(item),
    ]),
  );
}

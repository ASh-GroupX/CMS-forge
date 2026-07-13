import { HttpStatus } from '@nestjs/common';
import { ComplaintSeverity, ComplaintStatus, ComplaintTransitionAction, RoleCode } from '@prisma/client';
import type { AuthenticatedRequest } from '../../core/auth.guard.js';
import { AppException } from '../../core/http-kernel.js';

export function commentPermission(request: AuthenticatedRequest): string[] {
  const visibility = bodyField(request.body, 'visibility');
  if (visibility === 'INTERNAL') return ['COMPLAINT_COMMENT_INTERNAL'];
  if (visibility === 'PUBLIC') return ['COMPLAINT_COMMENT_PUBLIC'];
  return [];
}

export function transitionPermission(request: AuthenticatedRequest): string[] {
  const action = bodyField(request.body, 'action');
  switch (action) {
    case ComplaintTransitionAction.SUBMIT: return ['COMPLAINT_SUBMIT'];
    case ComplaintTransitionAction.ACCEPT_INTAKE:
    case ComplaintTransitionAction.APPROVE_AND_ROUTE:
    case ComplaintTransitionAction.SEND_BACK: return ['COMPLAINT_APPROVE'];
    case ComplaintTransitionAction.ASSIGN_INVESTIGATION:
    case ComplaintTransitionAction.ROUTE_AGAIN: return ['COMPLAINT_ASSIGN'];
    case ComplaintTransitionAction.RESOLVE:
    case ComplaintTransitionAction.RESOLVE_DIRECTLY: return ['COMPLAINT_RESOLVE'];
    case ComplaintTransitionAction.CLOSE: return ['COMPLAINT_CLOSE'];
    case ComplaintTransitionAction.REOPEN: return ['COMPLAINT_REOPEN'];
    case ComplaintTransitionAction.ADD_INVESTIGATION_UPDATE: return ['COMPLAINT_COMMENT_INTERNAL'];
    case ComplaintTransitionAction.REJECT_AS_INVALID:
    case ComplaintTransitionAction.REJECT_AFTER_REVIEW:
    case ComplaintTransitionAction.REJECT_AFTER_INVESTIGATION:
    case ComplaintTransitionAction.REJECT_RESOLUTION: return ['COMPLAINT_REJECT'];
    default: return [];
  }
}

export function auditContext(request: AuthenticatedRequest) {
  return {
    actorId: request.principal?.userId ?? null,
    actorRole: request.principal?.roleCode as RoleCode,
    sessionId: request.principal?.sessionId ?? null,
    correlationId: request.correlationId ?? headerValue(request.headers['x-correlation-id']),
    ipAddress: headerValue(request.headers['x-forwarded-for'])?.split(',')[0]?.trim() ?? request.socket?.remoteAddress ?? null,
    userAgent: headerValue(request.headers['user-agent']),
  };
}

export function targetComplaintId(body: unknown): string {
  const raw = body && typeof body === 'object' ? (body as Record<string, unknown>).targetComplaintId : undefined;
  const value = typeof raw === 'string' ? raw.trim() : '';
  if (!value) throw new AppException('VALIDATION_FAILED', 'Invalid complaint relation request', HttpStatus.BAD_REQUEST, [{ field: 'targetComplaintId', code: 'REQUIRED', message: 'targetComplaintId is required.' }]);
  return value;
}

export function requiredQuery(value: string | undefined, field: string): string {
  if (!value?.trim()) throw new AppException('VALIDATION_FAILED', 'Invalid complaint request', HttpStatus.BAD_REQUEST, [{ field, code: 'REQUIRED', message: `${field} is required.` }]);
  return value.trim();
}

export function queueBranchId(value: string | undefined, request: AuthenticatedRequest): string | null {
  if (value?.trim()) return value.trim();
  return request.principal?.roleCode === RoleCode.ADMIN ? null : request.principal?.branchId ?? null;
}

export function searchBranchId(value: string | undefined, request: AuthenticatedRequest): string | null {
  return request.principal?.roleCode === RoleCode.ADMIN ? optionalText(value) : request.principal?.branchId ?? null;
}

export function optionalText(value: string | undefined): string | null { return value?.trim() || null; }
export function requestRole(request: AuthenticatedRequest): RoleCode { return request.principal?.roleCode as RoleCode; }
export function optionalStatus(value: string | undefined): ComplaintStatus | null { return optionalEnum(value, ComplaintStatus, 'status') as ComplaintStatus | null; }
export function optionalSeverity(value: string | undefined): ComplaintSeverity | null { return optionalEnum(value, ComplaintSeverity, 'severity') as ComplaintSeverity | null; }
export function optionalSlaState(value: string | undefined): 'ON_TRACK' | 'WARNING' | 'BREACHED' | 'CLOSED' | null {
  return optionalEnum(value, { ON_TRACK: 'ON_TRACK', WARNING: 'WARNING', BREACHED: 'BREACHED', CLOSED: 'CLOSED' }, 'sla') as 'ON_TRACK' | 'WARNING' | 'BREACHED' | 'CLOSED' | null;
}

export function pageNumber(value: string | undefined, field: 'limit' | 'offset', fallback: number, max?: number): number {
  if (!value?.trim()) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < (field === 'limit' ? 1 : 0)) throw new AppException('VALIDATION_FAILED', 'Invalid complaint search query', HttpStatus.BAD_REQUEST, [{ field, code: 'INVALID', message: `${field} is invalid.` }]);
  return max ? Math.min(parsed, max) : parsed;
}

function bodyField(body: unknown, field: string): string | undefined {
  return body && typeof body === 'object' ? (body as Record<string, unknown>)[field] as string | undefined : undefined;
}

function headerValue(value: string | string[] | undefined): string | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function optionalEnum(value: string | undefined, options: Record<string, string>, field: string): string | null {
  if (!value?.trim()) return null;
  if (Object.values(options).includes(value)) return value;
  throw new AppException('VALIDATION_FAILED', 'Invalid complaint search query', HttpStatus.BAD_REQUEST, [{ field, code: 'INVALID', message: `${field} is invalid.` }]);
}

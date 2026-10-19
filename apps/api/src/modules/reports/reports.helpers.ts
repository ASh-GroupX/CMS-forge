import { HttpStatus } from '@nestjs/common';
import { ComplaintSeverity, RoleCode } from '@prisma/client';
import type { AuthenticatedRequest } from '../../core/auth.guard.js';
import { AppException } from '../../core/http-kernel.js';
import type { DashboardReportScope, ReportExportFormat } from './reports.service.js';

export function requestRole(request: AuthenticatedRequest): RoleCode {
  return request.principal?.roleCode as RoleCode;
}

export function scopedBranchId(queryBranchId: string | undefined, request: AuthenticatedRequest): string | null {
  if (request.principal?.roleCode === RoleCode.ADMIN || request.principal?.roleCode === RoleCode.CR_MANAGER) {
    return optionalText(queryBranchId);
  }
  return request.principal?.branchId ?? null;
}

export function optionalText(value: string | undefined): string | null {
  return value?.trim() || null;
}

export function optionalSeverity(value: string | undefined): ComplaintSeverity | null {
  if (!value?.trim()) return null;
  if (Object.values(ComplaintSeverity).includes(value as ComplaintSeverity)) {
    return value as ComplaintSeverity;
  }
  throw new AppException('VALIDATION_FAILED', 'Invalid report query', HttpStatus.BAD_REQUEST, [
    { field: 'severity', code: 'INVALID', message: 'severity is invalid.' },
  ]);
}

export function exportFormat(value: string | undefined): ReportExportFormat {
  if (value === 'csv' || value === 'excel') return value;
  throw new AppException('VALIDATION_FAILED', 'Invalid report query', HttpStatus.BAD_REQUEST, [
    { field: 'format', code: 'INVALID', message: 'format must be csv or excel.' },
  ]);
}

export function pageNumber(value: string | undefined, field: 'limit' | 'offset', fallback: number, max?: number): number {
  if (!value?.trim()) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < (field === 'limit' ? 1 : 0)) {
    throw new AppException('VALIDATION_FAILED', 'Invalid report query', HttpStatus.BAD_REQUEST, [
      { field, code: 'INVALID', message: `${field} is invalid.` },
    ]);
  }
  return max !== undefined ? Math.min(parsed, max) : parsed;
}

export function auditContext(request: AuthenticatedRequest) {
  return {
    actorId: request.principal?.userId ?? null,
    branchId: request.principal?.branchId ?? null,
    correlationId: request.correlationId ?? headerValue(request.headers['x-correlation-id']),
    ipAddress: headerValue(request.headers['x-forwarded-for'])?.split(',')[0]?.trim() ?? request.socket?.remoteAddress ?? null,
    userAgent: headerValue(request.headers['user-agent']),
  };
}

export function dashboardScope(request: AuthenticatedRequest, queryBranchId?: string): DashboardReportScope {
  return {
    role: requestRole(request),
    branchId: scopedBranchId(queryBranchId, request),
    departmentId: request.principal?.departmentId ?? null,
    userId: request.principal?.userId ?? null,
  };
}

export function reportInput(query: Record<string, string | undefined>, request: AuthenticatedRequest) {
  return {
    role: requestRole(request),
    branchId: scopedBranchId(undefined, request),
    filterBranchId: optionalText(query.branchId),
    categoryId: optionalText(query.categoryId),
    departmentId: optionalText(query.departmentId),
    ownerId: optionalText(query.ownerId),
    severity: optionalSeverity(query.severity),
    dateFrom: optionalText(query.dateFrom),
    dateTo: optionalText(query.dateTo),
  };
}

function headerValue(value: string | string[] | undefined): string | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

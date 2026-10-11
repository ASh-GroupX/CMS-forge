import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { PermissionGuard, Permissions, SessionAuthGuard } from '../../core/auth.guard.js';
import type { AuthenticatedRequest } from '../../core/auth.guard.js';
import { CsrfGuard } from '../../core/csrf.guard.js';
import { AppException } from '../../core/http-kernel.js';
import { AdminDepartmentsService } from './admin-departments.service.js';
import type { AdminDepartmentInput } from './admin-departments.service.js';

@Controller('admin/departments')
export class AdminDepartmentsController {
  constructor(private readonly departments: AdminDepartmentsService) {}

  @Post()
  @UseGuards(SessionAuthGuard, PermissionGuard, CsrfGuard)
  @Permissions('MASTER_DATA_MANAGE')
  create(@Body() body: unknown, @Req() request: AuthenticatedRequest) {
    return this.departments.createTopLevel(parseDepartment(body), auditContext(request));
  }
}

function parseDepartment(body: unknown): AdminDepartmentInput {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw badBody('body');
  const input = body as Record<string, unknown>;
  return {
    code: text(input.code, 'code'),
    nameEn: text(input.nameEn, 'nameEn'),
    nameAr: text(input.nameAr, 'nameAr'),
  };
}

function text(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) throw badBody(field);
  return value.trim();
}

function badBody(field: string): AppException {
  return new AppException('VALIDATION_FAILED', 'Invalid admin department request', 400, [
    { field, code: 'REQUIRED', message: `${field} is required.` },
  ]);
}

function auditContext(request: AuthenticatedRequest) {
  return {
    actorId: request.principal?.userId ?? null,
    correlationId: request.correlationId ?? headerValue(request.headers['x-correlation-id']),
    ipAddress: headerValue(request.headers['x-forwarded-for'])?.split(',')[0]?.trim() ?? request.socket?.remoteAddress ?? null,
    userAgent: headerValue(request.headers['user-agent']),
  };
}

function headerValue(value: string | string[] | undefined): string | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

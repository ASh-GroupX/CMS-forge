import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { RoleCode } from '@prisma/client';
import { RbacGuard, Roles, SessionAuthGuard } from '../../core/auth.guard.js';
import type { AuthenticatedRequest } from '../../core/auth.guard.js';
import { CsrfGuard } from '../../core/csrf.guard.js';
import { AppException } from '../../core/http-kernel.js';
import { AdminRolesService } from './admin-roles.service.js';
import type { CreateAdminRoleInput } from './admin-roles.service.js';

@Controller('admin/roles')
export class AdminRolesController {
  constructor(private readonly roles: AdminRolesService) {}

  @Get()
  @UseGuards(SessionAuthGuard, RbacGuard)
  @Roles(RoleCode.ADMIN)
  list() { return this.roles.list(); }

  @Post()
  @UseGuards(SessionAuthGuard, RbacGuard, CsrfGuard)
  @Roles(RoleCode.ADMIN)
  create(@Body() body: unknown, @Req() request: AuthenticatedRequest) { return this.roles.create(parseRole(body), auditContext(request)); }
}

function parseRole(body: unknown): CreateAdminRoleInput {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw badBody('body');
  const input = body as Record<string, unknown>;
  return { code: text(input.code, 'code'), nameEn: text(input.nameEn, 'nameEn'), nameAr: text(input.nameAr, 'nameAr'), permissionCodes: texts(input.permissionCodes, 'permissionCodes') };
}

function text(value: unknown, field: string): string { if (typeof value !== 'string' || !value.trim()) throw badBody(field); return value.trim(); }
function texts(value: unknown, field: string): string[] { if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) throw badBody(field); return value; }
function badBody(field: string): AppException { return new AppException('VALIDATION_FAILED', 'Invalid admin role request', 400, [{ field, code: 'REQUIRED', message: `${field} is required.` }]); }
function auditContext(request: AuthenticatedRequest) { return { actorId: request.principal?.userId ?? null, correlationId: request.correlationId ?? headerValue(request.headers['x-correlation-id']), ipAddress: headerValue(request.headers['x-forwarded-for'])?.split(',')[0]?.trim() ?? request.socket?.remoteAddress ?? null, userAgent: headerValue(request.headers['user-agent']) }; }
function headerValue(value: string | string[] | undefined): string | null { return Array.isArray(value) ? value[0] ?? null : value ?? null; }

import { Body, Controller, Get, Inject, Param, Post, Req, UseGuards } from '@nestjs/common';
import { PermissionGuard, Permissions, SessionAuthGuard } from '../../core/auth.guard.js';
import type { AuthenticatedRequest } from '../../core/auth.guard.js';
import { CsrfGuard } from '../../core/csrf.guard.js';
import { AppException } from '../../core/http-kernel.js';
import { AdminUsersService } from './admin-users.service.js';
import type { CreateAdminUserInput, StaffLookupActor } from './admin-users.service.js';

@Controller('admin/users')
export class AdminUsersController {
  constructor(@Inject(AdminUsersService) private readonly users: AdminUsersService) {}

  @Get()
  @UseGuards(SessionAuthGuard, PermissionGuard)
  @Permissions('USERS_MANAGE')
  list() {
    return this.users.list();
  }

  @Post()
  @UseGuards(SessionAuthGuard, PermissionGuard, CsrfGuard)
  @Permissions('USERS_MANAGE')
  create(@Body() body: unknown, @Req() request: AuthenticatedRequest) {
    return this.users.create(parseCreateUser(body), auditContext(request));
  }

  @Post(':id/department')
  @UseGuards(SessionAuthGuard, PermissionGuard, CsrfGuard)
  @Permissions('USERS_MANAGE')
  updateDepartment(@Param('id') id: string, @Body() body: unknown, @Req() request: AuthenticatedRequest) {
    return this.users.updateDepartment(id, departmentId(body), auditContext(request));
  }

  @Post(':id/deactivate')
  @UseGuards(SessionAuthGuard, PermissionGuard, CsrfGuard)
  @Permissions('USERS_MANAGE')
  deactivate(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.users.setActive(id, false, auditContext(request));
  }

  @Post(':id/reactivate')
  @UseGuards(SessionAuthGuard, PermissionGuard, CsrfGuard)
  @Permissions('USERS_MANAGE')
  reactivate(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.users.setActive(id, true, auditContext(request));
  }
}

@Controller('staff')
export class StaffLookupController {
  @Inject(AdminUsersService)
  private readonly users!: AdminUsersService;

  @Get('assignable')
  @UseGuards(SessionAuthGuard, PermissionGuard)
  @Permissions('COMPLAINT_COMMENT_INTERNAL')
  assignable(@Req() request: AuthenticatedRequest) {
    return this.users.assignableStaff(actor(request));
  }
}

function parseCreateUser(body: unknown): CreateAdminUserInput {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw badBody('body');
  const input = body as Record<string, unknown>;
  return {
    email: text(input.email, 'email'), nameEn: text(input.nameEn, 'nameEn'), nameAr: text(input.nameAr, 'nameAr'),
    roleCode: role(input.roleCode), branchId: optionalText(input.branchId), departmentId: text(input.departmentId, 'departmentId'), initialPassword: text(input.initialPassword, 'initialPassword'),
  };
}

function departmentId(body: unknown): string {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw badBody('departmentId');
  return text((body as Record<string, unknown>).departmentId, 'departmentId');
}

function text(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) throw badBody(field);
  return value.trim();
}

function optionalText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function role(value: unknown): string {
  if (typeof value === 'string' && value.trim()) return value.trim();
  throw badBody('roleCode');
}

function badBody(field: string): AppException {
  return new AppException('VALIDATION_FAILED', 'Invalid admin user request', 400, [{ field, code: 'REQUIRED', message: `${field} is required.` }]);
}

function auditContext(request: AuthenticatedRequest) {
  return {
    actorId: request.principal?.userId ?? null,
    correlationId: request.correlationId ?? headerValue(request.headers['x-correlation-id']),
    ipAddress: headerValue(request.headers['x-forwarded-for'])?.split(',')[0]?.trim() ?? request.socket?.remoteAddress ?? null,
    userAgent: headerValue(request.headers['user-agent']),
  };
}

function actor(request: AuthenticatedRequest): StaffLookupActor {
  const principal = request.principal;
  if (!principal?.userId) throw new AppException('AUTH_INVALID_CREDENTIALS', 'Invalid credentials', 401);
  return { userId: principal.userId, roleCode: principal.roleCode, branchId: principal.branchId };
}

function headerValue(value: string | string[] | undefined): string | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

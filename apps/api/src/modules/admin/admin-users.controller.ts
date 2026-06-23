import { Body, Controller, Get, Inject, Param, Post, Req, UseGuards } from '@nestjs/common';
import { RoleCode } from '@prisma/client';
import { RbacGuard, Roles, SessionAuthGuard } from '../../core/auth.guard.js';
import type { AuthenticatedRequest } from '../../core/auth.guard.js';
import { CsrfGuard } from '../../core/csrf.guard.js';
import { AppException } from '../../core/http-kernel.js';
import { AdminUsersService } from './admin-users.service.js';
import type { CreateAdminUserInput, StaffLookupActor } from './admin-users.service.js';

@Controller('admin/users')
export class AdminUsersController {
  constructor(@Inject(AdminUsersService) private readonly users: AdminUsersService) {}

  @Get()
  @UseGuards(SessionAuthGuard, RbacGuard)
  @Roles(RoleCode.ADMIN)
  list() {
    return this.users.list();
  }

  @Post()
  @UseGuards(SessionAuthGuard, RbacGuard, CsrfGuard)
  @Roles(RoleCode.ADMIN)
  create(@Body() body: unknown, @Req() request: AuthenticatedRequest) {
    return this.users.create(parseCreateUser(body), auditContext(request));
  }

  @Post(':id/deactivate')
  @UseGuards(SessionAuthGuard, RbacGuard, CsrfGuard)
  @Roles(RoleCode.ADMIN)
  deactivate(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.users.setActive(id, false, auditContext(request));
  }

  @Post(':id/reactivate')
  @UseGuards(SessionAuthGuard, RbacGuard, CsrfGuard)
  @Roles(RoleCode.ADMIN)
  reactivate(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.users.setActive(id, true, auditContext(request));
  }
}

@Controller('staff')
export class StaffLookupController {
  @Inject(AdminUsersService)
  private readonly users!: AdminUsersService;

  @Get('assignable')
  @UseGuards(SessionAuthGuard, RbacGuard)
  @Roles(RoleCode.CR_OFFICER, RoleCode.CR_MANAGER, RoleCode.BRANCH_MANAGER, RoleCode.ADMIN)
  assignable(@Req() request: AuthenticatedRequest) {
    return this.users.assignableStaff(actor(request));
  }
}

function parseCreateUser(body: unknown): CreateAdminUserInput {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw badBody('body');
  const input = body as Record<string, unknown>;
  return {
    email: text(input.email, 'email'), nameEn: text(input.nameEn, 'nameEn'), nameAr: text(input.nameAr, 'nameAr'),
    roleCode: role(input.roleCode), branchId: optionalText(input.branchId), initialPassword: text(input.initialPassword, 'initialPassword'),
  };
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

import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { PermissionGuard, Permissions, SessionAuthGuard } from '../../core/auth.guard.js';
import type { AuthenticatedRequest } from '../../core/auth.guard.js';
import { CsrfGuard } from '../../core/csrf.guard.js';
import { AppException } from '../../core/http-kernel.js';
import { AdminCategoriesService } from './admin-categories.service.js';
import type { AdminCategoryInput } from './admin-categories.service.js';

@Controller('admin/categories')
export class AdminCategoriesController {
  constructor(private readonly categories: AdminCategoriesService) {}

  @Get()
  @UseGuards(SessionAuthGuard, PermissionGuard)
  @Permissions('MASTER_DATA_MANAGE')
  list() {
    return this.categories.list();
  }

  @Post()
  @UseGuards(SessionAuthGuard, PermissionGuard, CsrfGuard)
  @Permissions('MASTER_DATA_MANAGE')
  create(@Body() body: unknown, @Req() request: AuthenticatedRequest) {
    return this.categories.create(parseCategory(body), auditContext(request));
  }

  @Patch(':id')
  @UseGuards(SessionAuthGuard, PermissionGuard, CsrfGuard)
  @Permissions('MASTER_DATA_MANAGE')
  update(@Param('id') id: string, @Body() body: unknown, @Req() request: AuthenticatedRequest) {
    return this.categories.update(id, parseCategory(body), auditContext(request));
  }

  @Post(':id/deactivate')
  @UseGuards(SessionAuthGuard, PermissionGuard, CsrfGuard)
  @Permissions('MASTER_DATA_MANAGE')
  deactivate(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.categories.deactivate(id, auditContext(request));
  }
}

function parseCategory(body: unknown): AdminCategoryInput {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw badBody('body');
  const input = body as Record<string, unknown>;
  return {
    code: text(input.code, 'code'),
    nameEn: text(input.nameEn, 'nameEn'),
    nameAr: text(input.nameAr, 'nameAr'),
    parentId: optionalText(input.parentId),
  };
}

function text(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) throw badBody(field);
  return value.trim();
}

function optionalText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function badBody(field: string): AppException {
  return new AppException('VALIDATION_FAILED', 'Invalid admin category request', 400, [{ field, code: 'REQUIRED', message: `${field} is required.` }]);
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

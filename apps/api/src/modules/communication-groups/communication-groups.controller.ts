import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { PermissionGuard, Permissions, SessionAuthGuard, type AuthenticatedRequest, type StaffPrincipal } from '../../core/auth.guard.js';
import { CsrfGuard } from '../../core/csrf.guard.js';
import { AppException } from '../../core/http-kernel.js';
import { parseCreateCommunicationGroupBody } from './dto/create-communication-group.dto.js';
import { parseUpdateCommunicationGroupBody } from './dto/update-communication-group.dto.js';
import { CommunicationGroupsService } from './communication-groups.service.js';

@Controller('communication-groups')
@UseGuards(SessionAuthGuard, PermissionGuard)
@Permissions('COMPLAINT_COMMENT_INTERNAL')
export class CommunicationGroupsController {
  constructor(@Inject(CommunicationGroupsService) private readonly groups: CommunicationGroupsService) {}

  @Get()
  list(@Req() request: AuthenticatedRequest) {
    return this.groups.list(actor(request));
  }

  @Post()
  @UseGuards(CsrfGuard)
  create(@Body() body: unknown, @Req() request: AuthenticatedRequest) {
    return this.groups.create(actor(request), parseCreateCommunicationGroupBody(body), auditContext(request));
  }

  @Patch(':id')
  @UseGuards(CsrfGuard)
  update(@Param('id') id: string, @Body() body: unknown, @Req() request: AuthenticatedRequest) {
    return this.groups.update(id, actor(request), parseUpdateCommunicationGroupBody(body), auditContext(request));
  }

  @Delete(':id')
  @UseGuards(CsrfGuard)
  async remove(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    await this.groups.deactivate(id, actor(request), auditContext(request));
    return { ok: true };
  }
}

function actor(request: AuthenticatedRequest) {
  const principal = principalFor(request);
  return { userId: principal.userId, roleCode: principal.roleCode, branchId: principal.branchId, permissions: principal.permissions ?? [] };
}

function principalFor(request: AuthenticatedRequest): StaffPrincipal {
  if (!request.principal?.userId) throw new AppException('AUTH_INVALID_CREDENTIALS', 'Invalid credentials', 401);
  return request.principal;
}

function auditContext(request: AuthenticatedRequest) {
  return { actorId: request.principal?.userId ?? null, correlationId: request.correlationId ?? headerValue(request.headers['x-correlation-id']), ipAddress: headerValue(request.headers['x-forwarded-for'])?.split(',')[0]?.trim() ?? request.socket?.remoteAddress ?? null, userAgent: headerValue(request.headers['user-agent']) };
}

function headerValue(value: string | string[] | undefined): string | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

import { Body, Controller, Get, Inject, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AppException } from '../../core/http-kernel.js';
import { BranchScoped, PermissionGuard, Permissions, RbacGuard, SessionAuthGuard } from '../../core/auth.guard.js';
import type { AuthenticatedRequest, StaffPrincipal } from '../../core/auth.guard.js';
import { CsrfGuard } from '../../core/csrf.guard.js';
import { parseCreateDealBody } from './dto/create-deal.dto.js';
import type { DealHandoffBoardResponseDto } from './dto/deal-response.dto.js';
import { parseAdvanceDealBody, parseDealBlockerBody } from './dto/update-deal.dto.js';
import { DealsService } from './deals.service.js';

@Controller('deals')
export class DealsController {
  constructor(@Inject(DealsService) private readonly dealsService: DealsService) {}

  @Get('handoff-board')
  @UseGuards(SessionAuthGuard, PermissionGuard, RbacGuard)
  @Permissions('REPORT_VIEW')
  @BranchScoped()
  async handoffBoard(@Req() request: AuthenticatedRequest): Promise<DealHandoffBoardResponseDto> {
    const principal = requirePrincipal(request);
    return this.dealsService.handoffBoard({ roleCode: principal.roleCode, branchId: principal.branchId });
  }

  @Post()
  @UseGuards(SessionAuthGuard, PermissionGuard, RbacGuard, CsrfGuard)
  @Permissions('COMPLAINT_ASSIGN')
  @BranchScoped()
  async create(@Body() body: unknown, @Req() request: AuthenticatedRequest): Promise<Record<string, unknown>> {
    const principal = requirePrincipal(request);
    const deal = await this.dealsService.createForActor(parseCreateDealBody(body), principal, auditContext(request, principal));
    return { deal };
  }

  @Post(':id/advance')
  @UseGuards(SessionAuthGuard, PermissionGuard, RbacGuard, CsrfGuard)
  @Permissions('COMPLAINT_ASSIGN')
  @BranchScoped()
  async advance(@Param('id') id: string, @Body() body: unknown, @Req() request: AuthenticatedRequest): Promise<Record<string, unknown>> {
    const principal = requirePrincipal(request);
    return this.dealsService.advanceForActor(id, parseAdvanceDealBody(body), principal, auditContext(request, principal));
  }

  @Patch(':id/blocker')
  @UseGuards(SessionAuthGuard, PermissionGuard, RbacGuard, CsrfGuard)
  @Permissions('COMPLAINT_ASSIGN')
  @BranchScoped()
  async blocker(@Param('id') id: string, @Body() body: unknown, @Req() request: AuthenticatedRequest): Promise<Record<string, unknown>> {
    const principal = requirePrincipal(request);
    const deal = await this.dealsService.updateBlockerForActor(id, parseDealBlockerBody(body).blocker, principal, auditContext(request, principal));
    return { deal };
  }
}

function requirePrincipal(request: AuthenticatedRequest): StaffPrincipal {
  const principal = request.principal;
  if (!principal?.userId) throw new AppException('AUTH_INVALID_CREDENTIALS', 'Invalid credentials', 401);
  return principal;
}

function auditContext(request: AuthenticatedRequest, principal: StaffPrincipal) {
  return {
    actorId: principal.userId,
    correlationId: request.correlationId ?? headerValue(request.headers['x-correlation-id']),
    ipAddress: headerValue(request.headers['x-forwarded-for'])?.split(',')[0]?.trim() ?? request.socket?.remoteAddress ?? null,
    userAgent: headerValue(request.headers['user-agent']),
  };
}

function headerValue(value: string | string[] | undefined): string | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

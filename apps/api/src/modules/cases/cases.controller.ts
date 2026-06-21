import { Body, Controller, Get, Inject, Param, Post, Req, UseGuards } from '@nestjs/common';
import { RoleCode } from '@prisma/client';
import { RbacGuard, Roles, SessionAuthGuard } from '../../core/auth.guard.js';
import type { AuthenticatedRequest } from '../../core/auth.guard.js';
import { CsrfGuard } from '../../core/csrf.guard.js';
import { CasesService } from './cases.service.js';
import type { CapaActionDto, CaseTimelineResponseDto } from './dto/case-response.dto.js';
import { parseCreateCapaBody, toCreateCapaInput } from './dto/case-capa.dto.js';

@Controller('cases')
export class CasesController {
  constructor(@Inject(CasesService) private readonly casesService: CasesService) {}

  @Get(':caseId/timeline')
  @UseGuards(SessionAuthGuard, RbacGuard)
  @Roles(RoleCode.CR_OFFICER, RoleCode.CR_MANAGER, RoleCode.BRANCH_MANAGER, RoleCode.ADMIN, RoleCode.MGMT_READONLY)
  async timeline(@Param('caseId') caseId: string, @Req() request: AuthenticatedRequest): Promise<CaseTimelineResponseDto> {
    return this.casesService.timelineForActor(caseId, actor(request), auditContext(request), false);
  }

  @Get(':caseId/confidential-timeline')
  @UseGuards(SessionAuthGuard, RbacGuard)
  @Roles(RoleCode.CR_OFFICER, RoleCode.CR_MANAGER, RoleCode.BRANCH_MANAGER, RoleCode.ADMIN, RoleCode.MGMT_READONLY)
  async confidentialTimeline(@Param('caseId') caseId: string, @Req() request: AuthenticatedRequest): Promise<CaseTimelineResponseDto> {
    return this.casesService.timelineForActor(caseId, actor(request), auditContext(request));
  }

  @Get(':caseId/capa')
  @UseGuards(SessionAuthGuard, RbacGuard)
  @Roles(RoleCode.CR_OFFICER, RoleCode.CR_MANAGER, RoleCode.BRANCH_MANAGER, RoleCode.ADMIN, RoleCode.MGMT_READONLY)
  async capa(@Param('caseId') caseId: string, @Req() request: AuthenticatedRequest): Promise<{ items: CapaActionDto[] }> {
    return { items: await this.casesService.listCapaActionsForActor(caseId, actor(request), auditContext(request)) };
  }

  @Post(':caseId/capa')
  @UseGuards(SessionAuthGuard, RbacGuard, CsrfGuard)
  @Roles(RoleCode.CR_OFFICER, RoleCode.CR_MANAGER, RoleCode.BRANCH_MANAGER, RoleCode.ADMIN)
  async createCapa(@Param('caseId') caseId: string, @Body() body: unknown, @Req() request: AuthenticatedRequest): Promise<{ capa: CapaActionDto }> {
    return { capa: await this.casesService.createCapaAction(toCreateCapaInput(caseId, parseCreateCapaBody(body)), actor(request), auditContext(request)) };
  }
}

function actor(request: AuthenticatedRequest) {
  return {
    userId: request.principal?.userId ?? '',
    role: request.principal?.roleCode as RoleCode,
    branchId: request.principal?.branchId ?? null,
  };
}

function auditContext(request: AuthenticatedRequest) {
  return {
    correlationId: request.correlationId ?? headerValue(request.headers['x-correlation-id']),
    ipAddress: headerValue(request.headers['x-forwarded-for'])?.split(',')[0]?.trim()
      ?? request.socket?.remoteAddress
      ?? null,
    userAgent: headerValue(request.headers['user-agent']),
  };
}

function headerValue(value: string | string[] | undefined): string | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

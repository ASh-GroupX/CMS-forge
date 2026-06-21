import { Controller, Get, Inject, Param, Req, UseGuards } from '@nestjs/common';
import { RoleCode } from '@prisma/client';
import { SessionAuthGuard } from '../../core/auth.guard.js';
import type { AuthenticatedRequest } from '../../core/auth.guard.js';
import { CasesService } from './cases.service.js';
import type { CaseTimelineResponseDto } from './dto/case-response.dto.js';

@Controller('cases')
export class CasesController {
  constructor(@Inject(CasesService) private readonly casesService: CasesService) {}

  @Get(':caseId/confidential-timeline')
  @UseGuards(SessionAuthGuard)
  async confidentialTimeline(@Param('caseId') caseId: string, @Req() request: AuthenticatedRequest): Promise<CaseTimelineResponseDto> {
    return this.casesService.timelineForActor(caseId, {
      userId: request.principal?.userId ?? '',
      role: request.principal?.roleCode as RoleCode,
      branchId: request.principal?.branchId ?? null,
    }, auditContext(request));
  }
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

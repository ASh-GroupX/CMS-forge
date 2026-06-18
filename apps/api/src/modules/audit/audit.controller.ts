import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import {
  RbacGuard,
  Roles,
  SessionAuthGuard,
} from '../../core/auth.guard.js';
import type { AuthenticatedRequest } from '../../core/auth.guard.js';
import { AuditSearchService } from './audit.service.js';
import { parseAuditSearchQuery } from './audit.service.js';

@Controller('audit')
export class AuditController {
  constructor(private readonly auditSearch: AuditSearchService) {}

  @Get('logs')
  @UseGuards(SessionAuthGuard, RbacGuard)
  @Roles('ADMIN')
  async search(
    @Query() query: Record<string, unknown>,
    @Req() request: AuthenticatedRequest,
  ): Promise<Record<string, unknown>> {
    return this.auditSearch.search(parseAuditSearchQuery(query), request.principal!);
  }
}

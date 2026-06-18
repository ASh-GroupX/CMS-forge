import { Controller, Get, Query, Req, Res, UseGuards } from '@nestjs/common';
import {
  RbacGuard,
  Roles,
  SessionAuthGuard,
} from '../../core/auth.guard.js';
import type { AuthenticatedRequest } from '../../core/auth.guard.js';
import { AuditSearchService } from './audit.service.js';
import { parseAuditSearchQuery } from './audit.service.js';

type ResponseLike = {
  setHeader(name: string, value: string): void;
};

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

  @Get('logs/export')
  @UseGuards(SessionAuthGuard, RbacGuard)
  @Roles('ADMIN')
  async export(
    @Query() query: Record<string, unknown>,
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: ResponseLike,
  ): Promise<string> {
    const result = await this.auditSearch.export(parseAuditSearchQuery(query), request.principal!, {
      correlationId: request.correlationId ?? headerValue(request.headers['x-correlation-id']),
      ipAddress: headerValue(request.headers['x-forwarded-for'])?.split(',')[0]?.trim()
        ?? request.socket?.remoteAddress
        ?? null,
      userAgent: headerValue(request.headers['user-agent']),
    });
    response.setHeader('Content-Type', 'application/json');
    response.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    return result.body;
  }
}

function headerValue(value: string | string[] | undefined): string | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

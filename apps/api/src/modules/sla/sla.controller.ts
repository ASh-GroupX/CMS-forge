import { Body, Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { PermissionGuard, Permissions, SessionAuthGuard } from '../../core/auth.guard.js';
import type { AuthenticatedRequest } from '../../core/auth.guard.js';
import { CsrfGuard } from '../../core/csrf.guard.js';
import { parseUpdateSlaEscalationConfigBody, parseUpdateSlaPolicyConfigBody } from './dto/update-sla.dto.js';
import { SlaService } from './sla.service.js';

@Controller('sla')
export class SlaController {
  constructor(private readonly slaService: SlaService) {}

  @Get('policies')
  @UseGuards(SessionAuthGuard, PermissionGuard)
  @Permissions('SLA_MANAGE')
  async listPolicies() {
    return this.slaService.listPolicies();
  }

  @Patch('policies/:id')
  @UseGuards(SessionAuthGuard, PermissionGuard, CsrfGuard)
  @Permissions('SLA_MANAGE')
  async updatePolicyConfig(@Param('id') id: string, @Body() body: unknown, @Req() request: AuthenticatedRequest) {
    return { policy: await this.slaService.updatePolicyConfig(id, parseUpdateSlaPolicyConfigBody(body), auditContext(request)) };
  }

  @Patch('policies/:id/escalation')
  @UseGuards(SessionAuthGuard, PermissionGuard, CsrfGuard)
  @Permissions('SLA_MANAGE')
  async updatePolicyEscalationConfig(@Param('id') id: string, @Body() body: unknown, @Req() request: AuthenticatedRequest) {
    return { policy: await this.slaService.updatePolicyEscalationConfig(id, parseUpdateSlaEscalationConfigBody(body), auditContext(request)) };
  }
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

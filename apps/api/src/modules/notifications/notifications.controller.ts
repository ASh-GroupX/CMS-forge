import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { RoleCode } from '@prisma/client';
import { RbacGuard, Roles, SessionAuthGuard } from '../../core/auth.guard.js';
import type { AuthenticatedRequest } from '../../core/auth.guard.js';
import { CsrfGuard } from '../../core/csrf.guard.js';
import { parseCreateTemplateBody, parseUpdateTemplateBody } from './notification-template.rules.js';
import { NotificationsService } from './notifications.service.js';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('templates')
  @UseGuards(SessionAuthGuard, RbacGuard)
  @Roles(RoleCode.ADMIN)
  async listTemplates() {
    return { items: await this.notificationsService.listTemplates() };
  }

  @Post('templates')
  @UseGuards(SessionAuthGuard, RbacGuard, CsrfGuard)
  @Roles(RoleCode.ADMIN)
  async createTemplate(@Body() body: unknown, @Req() request: AuthenticatedRequest) {
    return { template: await this.notificationsService.createTemplate(parseCreateTemplateBody(body), auditContext(request)) };
  }

  @Patch('templates/:id')
  @UseGuards(SessionAuthGuard, RbacGuard, CsrfGuard)
  @Roles(RoleCode.ADMIN)
  async updateTemplate(@Param('id') id: string, @Body() body: unknown, @Req() request: AuthenticatedRequest) {
    return { template: await this.notificationsService.updateTemplate(id, parseUpdateTemplateBody(body), auditContext(request)) };
  }

  @Post('templates/:id/activate')
  @UseGuards(SessionAuthGuard, RbacGuard, CsrfGuard)
  @Roles(RoleCode.ADMIN)
  async activateTemplate(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return { template: await this.notificationsService.setTemplateActive(id, true, auditContext(request)) };
  }

  @Post('templates/:id/deactivate')
  @UseGuards(SessionAuthGuard, RbacGuard, CsrfGuard)
  @Roles(RoleCode.ADMIN)
  async deactivateTemplate(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return { template: await this.notificationsService.setTemplateActive(id, false, auditContext(request)) };
  }
}

function auditContext(request: AuthenticatedRequest) {
  return {
    actorId: request.principal?.userId ?? null,
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

import { Body, Controller, Get, Inject, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { PermissionGuard, Permissions, SessionAuthGuard } from '../../core/auth.guard.js';
import type { AuthenticatedRequest } from '../../core/auth.guard.js';
import { CsrfGuard } from '../../core/csrf.guard.js';
import { AppException } from '../../core/http-kernel.js';
import { parseCreateTemplateBody, parseUpdateTemplateBody } from './notification-template.rules.js';
import { NotificationsService } from './notifications.service.js';

@Controller('notifications')
export class NotificationsController {
  constructor(@Inject(NotificationsService) private readonly notificationsService: NotificationsService) {}

  @Get()
  @UseGuards(SessionAuthGuard, PermissionGuard)
  @Permissions('STAFF_LOGIN')
  async listMine(@Req() request: AuthenticatedRequest) {
    const userId = request.principal?.userId;
    if (!userId) throw new AppException('AUTH_INVALID_CREDENTIALS', 'Invalid credentials', 401);
    return { items: await this.notificationsService.listForRecipient(userId) };
  }

  @Get('templates')
  @UseGuards(SessionAuthGuard, PermissionGuard)
  @Permissions('NOTIFICATIONS_MANAGE')
  async listTemplates() {
    return { items: await this.notificationsService.listTemplates() };
  }

  @Post('templates')
  @UseGuards(SessionAuthGuard, PermissionGuard, CsrfGuard)
  @Permissions('NOTIFICATIONS_MANAGE')
  async createTemplate(@Body() body: unknown, @Req() request: AuthenticatedRequest) {
    return { template: await this.notificationsService.createTemplate(parseCreateTemplateBody(body), auditContext(request)) };
  }

  @Patch('templates/:id')
  @UseGuards(SessionAuthGuard, PermissionGuard, CsrfGuard)
  @Permissions('NOTIFICATIONS_MANAGE')
  async updateTemplate(@Param('id') id: string, @Body() body: unknown, @Req() request: AuthenticatedRequest) {
    return { template: await this.notificationsService.updateTemplate(id, parseUpdateTemplateBody(body), auditContext(request)) };
  }

  @Post('templates/:id/activate')
  @UseGuards(SessionAuthGuard, PermissionGuard, CsrfGuard)
  @Permissions('NOTIFICATIONS_MANAGE')
  async activateTemplate(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return { template: await this.notificationsService.setTemplateActive(id, true, auditContext(request)) };
  }

  @Post('templates/:id/deactivate')
  @UseGuards(SessionAuthGuard, PermissionGuard, CsrfGuard)
  @Permissions('NOTIFICATIONS_MANAGE')
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

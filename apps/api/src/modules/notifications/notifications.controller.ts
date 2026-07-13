import { Body, Controller, Get, Inject, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
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
  async listMine(@Req() request: AuthenticatedRequest, @Query() query: Record<string, unknown>) {
    const userId = request.principal?.userId;
    if (!userId) throw new AppException('AUTH_INVALID_CREDENTIALS', 'Invalid credentials', 401);
    return { items: await this.notificationsService.listForRecipient(userId, notificationListQuery(query)) };
  }

  @Post(':id/read')
  @UseGuards(SessionAuthGuard, PermissionGuard, CsrfGuard)
  @Permissions('STAFF_LOGIN')
  async markRead(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    const userId = request.principal?.userId;
    if (!userId) throw new AppException('AUTH_INVALID_CREDENTIALS', 'Invalid credentials', 401);
    return this.notificationsService.markRead(id, userId, auditContext(request));
  }

  @Post('read-all')
  @UseGuards(SessionAuthGuard, PermissionGuard, CsrfGuard)
  @Permissions('STAFF_LOGIN')
  async markAllRead(@Req() request: AuthenticatedRequest) {
    const userId = request.principal?.userId;
    if (!userId) throw new AppException('AUTH_INVALID_CREDENTIALS', 'Invalid credentials', 401);
    return this.notificationsService.markAllRead(userId, auditContext(request));
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

function notificationListQuery(query: Record<string, unknown>): { limit: number; view: 'all' | 'unread' | 'mentions' } {
  const view = query.view === undefined ? 'all' : query.view;
  const limit = query.limit === undefined ? 50 : Number(query.limit);
  if (!['all', 'unread', 'mentions'].includes(String(view)) || !Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new AppException('VALIDATION_FAILED', 'Invalid notification filters', 400, [
      { field: 'view', code: 'INVALID', message: 'view or limit is invalid.' },
    ]);
  }
  return { limit, view: view as 'all' | 'unread' | 'mentions' };
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

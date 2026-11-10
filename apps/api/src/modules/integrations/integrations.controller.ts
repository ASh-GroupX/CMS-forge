import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { PermissionGuard, Permissions, Roles, RbacGuard, SessionAuthGuard } from '../../core/auth.guard.js';
import type { AuthenticatedRequest } from '../../core/auth.guard.js';
import { CsrfGuard } from '../../core/csrf.guard.js';
import type { DmsLookupQueryDto, DmsLookupResponseDto } from './dto/dms-lookup.dto.js';
import { toDmsLookupQuery } from './dto/dms-lookup.dto.js';
import { IntegrationsService } from './integrations.service.js';

@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get('dms/customer-vehicle')
  @UseGuards(SessionAuthGuard, PermissionGuard)
  @Permissions('COMPLAINT_CREATE')
  async lookupDmsCustomerVehicle(
    @Query() query: DmsLookupQueryDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<DmsLookupResponseDto> {
    return { lookup: await this.integrationsService.lookupDmsCustomerVehicle(toDmsLookupQuery(query, request)) };
  }

  @Post('data-api-keys')
  @UseGuards(SessionAuthGuard, RbacGuard, PermissionGuard, CsrfGuard)
  @Roles('ADMIN')
  @Permissions('INTEGRATIONS_MANAGE')
  async createDataApiKey(@Body() body: unknown, @Req() request: AuthenticatedRequest) {
    return this.integrationsService.createDataApiKey(body, auditContext(request));
  }

  @Get('data-api-keys')
  @UseGuards(SessionAuthGuard, RbacGuard, PermissionGuard)
  @Roles('ADMIN')
  @Permissions('INTEGRATIONS_MANAGE')
  async listDataApiKeys() {
    return { items: await this.integrationsService.listDataApiKeys() };
  }

  @Post('data-api-keys/:id/revoke')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SessionAuthGuard, RbacGuard, PermissionGuard, CsrfGuard)
  @Roles('ADMIN')
  @Permissions('INTEGRATIONS_MANAGE')
  async revokeDataApiKey(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.integrationsService.revokeDataApiKey(id, auditContext(request));
  }
}

function auditContext(request: AuthenticatedRequest) {
  const forwardedFor = request.headers['x-forwarded-for'];
  const userAgent = request.headers['user-agent'];
  return {
    actorId: request.principal?.userId ?? null,
    correlationId: request.correlationId ?? headerValue(request.headers['x-correlation-id']),
    ipAddress: Array.isArray(forwardedFor) ? forwardedFor[0]?.split(',')[0]?.trim() ?? null : forwardedFor?.split(',')[0]?.trim() ?? request.socket?.remoteAddress ?? null,
    userAgent: Array.isArray(userAgent) ? userAgent[0] ?? null : userAgent ?? null,
  };
}

function headerValue(value: string | string[] | undefined): string | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

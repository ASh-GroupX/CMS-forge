import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { PermissionGuard, Permissions, SessionAuthGuard } from '../../core/auth.guard.js';
import type { AuthenticatedRequest } from '../../core/auth.guard.js';
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
}

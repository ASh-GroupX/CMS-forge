import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { IntegrationApiKeyGuard, IntegrationApiScopes } from '../integrations/integration-api-key.guard.js';
import type { IntegrationApiRequest } from '../integrations/integration-api-key.guard.js';
import { ExternalDataService } from './external-data.service.js';

@Controller('external-data')
export class ExternalDataController {
  constructor(private readonly data: ExternalDataService) {}

  @Get('customers')
  @UseGuards(IntegrationApiKeyGuard)
  @IntegrationApiScopes('customers:read')
  customers(@Query() query: Record<string, unknown>, @Req() request: IntegrationApiRequest) {
    return this.data.page('customers', query, request);
  }

  @Get('complaints')
  @UseGuards(IntegrationApiKeyGuard)
  @IntegrationApiScopes('complaints:read')
  complaints(@Query() query: Record<string, unknown>, @Req() request: IntegrationApiRequest) {
    return this.data.page('complaints', query, request);
  }

  @Get('tasks')
  @UseGuards(IntegrationApiKeyGuard)
  @IntegrationApiScopes('tasks:read')
  tasks(@Query() query: Record<string, unknown>, @Req() request: IntegrationApiRequest) {
    return this.data.page('tasks', query, request);
  }

  @Get('appointments')
  @UseGuards(IntegrationApiKeyGuard)
  @IntegrationApiScopes('appointments:read')
  appointments(@Query() query: Record<string, unknown>, @Req() request: IntegrationApiRequest) {
    return this.data.page('appointments', query, request);
  }

  @Get('tickets')
  @UseGuards(IntegrationApiKeyGuard)
  @IntegrationApiScopes('tickets:read')
  tickets(@Query() query: Record<string, unknown>, @Req() request: IntegrationApiRequest) {
    return this.data.page('tickets', query, request);
  }

  @Get('complaints/:id/events')
  @UseGuards(IntegrationApiKeyGuard)
  @IntegrationApiScopes('complaints:read')
  complaintEvents(@Param('id') id: string, @Query() query: Record<string, unknown>, @Req() request: IntegrationApiRequest) {
    return this.data.events('complaints', id, query, request);
  }

  @Get('tickets/:id/events')
  @UseGuards(IntegrationApiKeyGuard)
  @IntegrationApiScopes('tickets:read')
  ticketEvents(@Param('id') id: string, @Query() query: Record<string, unknown>, @Req() request: IntegrationApiRequest) {
    return this.data.events('tickets', id, query, request);
  }
}

import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
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
}

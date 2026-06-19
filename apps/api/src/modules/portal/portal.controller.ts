import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import type { IncomingMessage } from 'node:http';
import { PortalSubmissionRateLimitGuard } from '../../core/rate-limit.guard.js';
import { parsePortalComplaintBody, toPortalComplaintInput } from './dto/create-portal.dto.js';
import type { PortalComplaintResponseDto } from './dto/portal-response.dto.js';
import { PortalService } from './portal.service.js';

@Controller('portal')
export class PortalController {
  constructor(private readonly portalService: PortalService) {}

  @Post('complaints')
  @UseGuards(PortalSubmissionRateLimitGuard)
  async submitComplaint(
    @Body() body: unknown,
    @Req() request: IncomingMessage & { correlationId?: string },
  ): Promise<PortalComplaintResponseDto> {
    return {
      complaint: await this.portalService.submitComplaint(
        toPortalComplaintInput(parsePortalComplaintBody(body), auditContext(request)),
      ),
    };
  }
}

function auditContext(request: IncomingMessage & { correlationId?: string }) {
  return {
    correlationId: request.correlationId ?? headerValue(request.headers['x-correlation-id']),
    ipAddress: headerValue(request.headers['x-forwarded-for'])?.split(',')[0]?.trim()
      ?? request.socket.remoteAddress
      ?? null,
    userAgent: headerValue(request.headers['user-agent']),
  };
}

function headerValue(value: string | string[] | undefined): string | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

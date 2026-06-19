import { Body, Controller, Get, Headers, Post, Req, UseGuards } from '@nestjs/common';
import type { IncomingMessage } from 'node:http';
import { PortalSubmissionRateLimitGuard, PortalTrackingOtpRateLimitGuard } from '../../core/rate-limit.guard.js';
import { parsePortalComplaintBody, toPortalComplaintInput } from './dto/create-portal.dto.js';
import { parsePortalFollowUpBody, parsePortalTrackingOtpBody, parsePortalTrackingOtpVerifyBody, toPortalOtpInput, toPortalOtpVerifyInput } from './dto/portal-tracking.dto.js';
import type { PortalComplaintResponseDto, PortalFollowUpResponseDto, PortalOtpRequestResponseDto, PortalSessionResponseDto, PortalTrackingResponseDto } from './dto/portal-response.dto.js';
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

  @Post('tracking/otp')
  @UseGuards(PortalTrackingOtpRateLimitGuard)
  async requestTrackingOtp(
    @Body() body: unknown,
    @Req() request: IncomingMessage & { correlationId?: string },
  ): Promise<PortalOtpRequestResponseDto> {
    return this.portalService.requestTrackingOtp(toPortalOtpInput(parsePortalTrackingOtpBody(body), auditContext(request)));
  }

  @Post('tracking/otp/verify')
  async verifyTrackingOtp(
    @Body() body: unknown,
    @Req() request: IncomingMessage & { correlationId?: string },
  ): Promise<PortalSessionResponseDto> {
    return { session: await this.portalService.verifyTrackingOtp(toPortalOtpVerifyInput(parsePortalTrackingOtpVerifyBody(body), auditContext(request))) };
  }

  @Get('tracking')
  async getTracking(
    @Headers('x-portal-session') sessionToken: string | undefined,
    @Req() request: IncomingMessage & { correlationId?: string },
  ): Promise<PortalTrackingResponseDto> {
    return { complaint: await this.portalService.getTracking({ sessionToken: sessionToken ?? '', ...auditContext(request) }) };
  }

  @Post('tracking/follow-ups')
  async submitFollowUp(
    @Headers('x-portal-session') sessionToken: string | undefined,
    @Body() body: unknown,
    @Req() request: IncomingMessage & { correlationId?: string },
  ): Promise<PortalFollowUpResponseDto> {
    return this.portalService.submitFollowUp({ sessionToken: sessionToken ?? '', ...parsePortalFollowUpBody(body), ...auditContext(request) });
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

import { Body, Controller, Get, Headers, Inject, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  SessionAuthGuard,
} from '../../core/auth.guard.js';
import type { AuthenticatedRequest } from '../../core/auth.guard.js';
import {
  createCsrfToken,
  CsrfGuard,
  serializeCsrfCookie,
  serializeExpiredCsrfCookie,
} from '../../core/csrf.guard.js';
import { LoginRateLimitGuard } from '../../core/rate-limit.guard.js';
import { AuthService } from './auth.service.js';
import type { AuthAuditContext } from './auth.service.js';
import { LoginRequestDto } from './dto/login-request.dto.js';
import { PasswordResetConsumeDto, PasswordResetRequestDto } from './dto/password-reset.dto.js';

const STAFF_SESSION_COOKIE = 'cms_staff_session';

type CookieResponse = Pick<ServerResponse, 'setHeader'>;
type AuthRequest = IncomingMessage & { correlationId?: string };

@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Post('login')
  @UseGuards(LoginRateLimitGuard)
  async login(
    @Body() body: unknown,
    @Req() request: AuthRequest,
    @Res({ passthrough: true }) response: CookieResponse,
  ): Promise<Record<string, unknown>> {
    const input = LoginRequestDto.from(body);
    const audit = auditContext(request);
    const secureCookie = process.env.NODE_ENV === 'production';
    const user = await this.authService.verifyCredentials({ ...input, audit });
    const session = await this.authService.createStaffSession({
      userId: user.userId,
      branchId: user.branchId,
      secureCookie,
      audit,
    });

    response.setHeader('Set-Cookie', [session.cookie, serializeCsrfCookie(createCsrfToken(), secureCookie)]);

    return {
      user,
      expiresAt: session.expiresAt.toISOString(),
    };
  }

  @Post('logout')
  @UseGuards(SessionAuthGuard, CsrfGuard)
  async logout(
    @Headers('cookie') cookieHeader: string | undefined,
    @Req() request: AuthRequest,
    @Res({ passthrough: true }) response: CookieResponse,
  ): Promise<{ ok: true }> {
    const secureCookie = process.env.NODE_ENV === 'production';
    const expiredCookie = await this.authService.logoutStaffSessionWithAudit(
      readCookie(cookieHeader ?? '', STAFF_SESSION_COOKIE),
      secureCookie,
      new Date(),
      auditContext(request),
    );

    response.setHeader('Set-Cookie', [expiredCookie, serializeExpiredCsrfCookie(secureCookie)]);
    return { ok: true };
  }

  @Post('password-reset/request')
  async requestPasswordReset(@Body() body: unknown, @Req() request: AuthRequest): Promise<{ ok: true }> {
    const input = PasswordResetRequestDto.from(body);
    await this.authService.requestPasswordReset(input.identifier, auditContext(request));
    return { ok: true };
  }

  @Post('password-reset/consume')
  async consumePasswordReset(@Body() body: unknown, @Req() request: AuthRequest): Promise<{ ok: boolean }> {
    const input = PasswordResetConsumeDto.from(body);
    return this.authService.consumePasswordReset({
      token: input.token,
      newPassword: input.newPassword,
      audit: auditContext(request),
    });
  }

  @Get('me')
  @UseGuards(SessionAuthGuard)
  me(@Req() request: AuthenticatedRequest): Record<string, unknown> {
    return { user: request.principal };
  }
}

function auditContext(request: AuthRequest): AuthAuditContext {
  const forwardedFor = request.headers['x-forwarded-for'];
  const userAgent = request.headers['user-agent'];

  return {
    correlationId: request.correlationId ?? headerValue(request.headers['x-correlation-id']),
    ipAddress: headerValue(forwardedFor)?.split(',')[0]?.trim() ?? request.socket.remoteAddress ?? null,
    userAgent: headerValue(userAgent),
  };
}

function headerValue(value: string | string[] | undefined): string | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function readCookie(header: string, name: string): string {
  return header
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1) ?? '';
}

import { Body, Controller, Headers, Post, Req, Res } from '@nestjs/common';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { AuthService } from './auth.service.js';
import type { AuthAuditContext } from './auth.service.js';
import { LoginRequestDto } from './dto/login-request.dto.js';

const STAFF_SESSION_COOKIE = 'cms_staff_session';

type CookieResponse = Pick<ServerResponse, 'setHeader'>;
type AuthRequest = IncomingMessage & { correlationId?: string };

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(
    @Body() body: unknown,
    @Req() request: AuthRequest,
    @Res({ passthrough: true }) response: CookieResponse,
  ): Promise<Record<string, unknown>> {
    const input = LoginRequestDto.from(body);
    const audit = auditContext(request);
    const user = await this.authService.verifyCredentials({ ...input, audit });
    const session = await this.authService.createStaffSession({
      userId: user.userId,
      branchId: user.branchId,
      secureCookie: process.env.NODE_ENV === 'production',
      audit,
    });

    response.setHeader('Set-Cookie', session.cookie);

    return {
      user,
      expiresAt: session.expiresAt.toISOString(),
    };
  }

  @Post('logout')
  async logout(
    @Headers('cookie') cookieHeader: string | undefined,
    @Req() request: AuthRequest,
    @Res({ passthrough: true }) response: CookieResponse,
  ): Promise<{ ok: true }> {
    const expiredCookie = await this.authService.logoutStaffSessionWithAudit(
      readCookie(cookieHeader ?? '', STAFF_SESSION_COOKIE),
      process.env.NODE_ENV === 'production',
      new Date(),
      auditContext(request),
    );

    response.setHeader('Set-Cookie', expiredCookie);
    return { ok: true };
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

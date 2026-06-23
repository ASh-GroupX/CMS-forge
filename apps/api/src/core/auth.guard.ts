import {
  CanActivate,
  ExecutionContext,
  Inject,
  HttpStatus,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuditService } from './audit.service.js';
import type { AuditRecordInput } from './audit.service.js';
import { AppException } from './http-kernel.js';

const STAFF_SESSION_COOKIE = 'cms_staff_session';
const ROLES_KEY = 'cms:auto:roles';
const PERMISSIONS_KEY = 'cms:auto:permissions';
const BRANCH_SCOPED_KEY = 'cms:auto:branch-scoped';

export const SESSION_AUTH_SERVICE = Symbol('SESSION_AUTH_SERVICE');

export type StaffPrincipal = {
  sessionId: string;
  userId: string;
  email: string;
  nameEn: string;
  nameAr: string;
  roleCode: string;
  permissions?: string[];
  branchId: string | null;
};

export type AuthenticatedRequest = RequestLike & {
  principal?: StaffPrincipal;
  correlationId?: string;
};

type RequestLike = {
  headers: Record<string, string | string[] | undefined>;
  url?: string;
  socket?: { remoteAddress?: string };
};

export type SessionAuthValidator = {
  validateStaffSession(token: string): Promise<StaffPrincipal>;
};

export function Roles(...roles: string[]): MethodDecorator & ClassDecorator {
  return SetMetadata(ROLES_KEY, roles);
}

export function Permissions(...permissions: string[]): MethodDecorator & ClassDecorator {
  return SetMetadata(PERMISSIONS_KEY, permissions);
}

export function BranchScoped(): MethodDecorator & ClassDecorator {
  return SetMetadata(BRANCH_SCOPED_KEY, true);
}

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(
    @Inject(SESSION_AUTH_SERVICE)
    private readonly authService: SessionAuthValidator,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = readCookie(headerValue(request.headers.cookie) ?? '', STAFF_SESSION_COOKIE);

    if (!token) {
      throw new AppException('AUTH_INVALID_CREDENTIALS', 'Invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    request.principal = await this.authService.validateStaffSession(token);
    return true;
  }
}

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(
    @Inject(Reflector)
    private readonly reflector: Reflector,
    @Inject(AuditService)
    private readonly auditService: AuditService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const principal = request.principal;

    if (!principal) {
      throw new AppException('AUTH_INVALID_CREDENTIALS', 'Invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    const roles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]) ?? [];

    if (roles.length > 0 && !roles.includes(principal.roleCode)) {
      await this.recordSecurityDeny(request, 'rbac_forbidden');
      throw new AppException('RBAC_FORBIDDEN', 'Forbidden', HttpStatus.FORBIDDEN);
    }

    const branchScoped = this.reflector.getAllAndOverride<boolean>(BRANCH_SCOPED_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const branchId = requestedBranchId(request);

    if (branchScoped && branchId && principal.roleCode !== 'ADMIN' && principal.branchId !== branchId) {
      await this.recordSecurityDeny(request, 'branch_scope_forbidden', branchId);
      throw new AppException('BRANCH_SCOPE_FORBIDDEN', 'Forbidden', HttpStatus.FORBIDDEN);
    }

    return true;
  }

  private async recordSecurityDeny(
    request: AuthenticatedRequest,
    action: 'rbac_forbidden' | 'branch_scope_forbidden',
    deniedBranchId?: string,
  ): Promise<void> {
    const principal = request.principal;
    const record: AuditRecordInput = {
      eventType: 'SECURITY',
      action,
      actorId: principal?.userId ?? null,
      branchId: principal?.branchId ?? null,
      targetType: 'api_route',
      targetId: request.url ?? null,
      correlationId: request.correlationId ?? headerValue(request.headers['x-correlation-id']),
      ipAddress: headerValue(request.headers['x-forwarded-for'])?.split(',')[0]?.trim()
        ?? request.socket?.remoteAddress
        ?? null,
      userAgent: headerValue(request.headers['user-agent']),
    };

    await this.auditService.record(
      deniedBranchId ? { ...record, metadata: { deniedBranchId } } : record,
    );
  }
}

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(@Inject(Reflector) private readonly reflector: Reflector, @Inject(AuditService) private readonly auditService: AuditService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]) ?? [];
    if (required.length === 0 || required.every((permission) => request.principal?.permissions?.includes(permission))) return true;
    await this.auditService.record({ eventType: 'SECURITY', action: 'permission_forbidden', actorId: request.principal?.userId ?? null, branchId: request.principal?.branchId ?? null, targetType: 'api_route', targetId: request.url ?? null, correlationId: request.correlationId ?? null });
    throw new AppException('RBAC_FORBIDDEN', 'Forbidden', HttpStatus.FORBIDDEN);
  }
}

function requestedBranchId(request: AuthenticatedRequest): string | null {
  const url = new URL(request.url ?? '/', 'http://localhost');
  return url.searchParams.get('branchId');
}

function readCookie(header: string, name: string): string {
  return header
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1) ?? '';
}

function headerValue(value: string | string[] | undefined): string | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

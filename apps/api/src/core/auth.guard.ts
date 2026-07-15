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
const DYNAMIC_PERMISSIONS_KEY = 'cms:auto:dynamic-permissions';
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
  departmentId?: string | null;
  branchName?: string | null;
  branchNameAr?: string | null;
  branchTimezone?: string | null;
};

export type AuthenticatedRequest = RequestLike & {
  principal?: StaffPrincipal;
  correlationId?: string;
};

type RequestLike = {
  headers: Record<string, string | string[] | undefined>;
  method?: string;
  url?: string;
  body?: unknown;
  socket?: { remoteAddress?: string };
};

type DynamicPermissionResolver = (request: AuthenticatedRequest) => string[];

export type SessionAuthValidator = {
  validateStaffSession(token: string): Promise<StaffPrincipal>;
};

export function Roles(...roles: string[]): MethodDecorator & ClassDecorator {
  return SetMetadata(ROLES_KEY, roles);
}

export function Permissions(...permissions: string[]): MethodDecorator & ClassDecorator {
  return SetMetadata(PERMISSIONS_KEY, permissions);
}

export function DynamicPermissions(resolver: DynamicPermissionResolver): MethodDecorator & ClassDecorator {
  return SetMetadata(DYNAMIC_PERMISSIONS_KEY, resolver);
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
      targetId: requestPath(request),
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

    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]) ?? [];

    if (hasPermissions(principal, required)) {
      return true;
    }

    await this.auditService.record(permissionDenyAudit(request, context, required));
    throw new AppException('RBAC_FORBIDDEN', 'Forbidden', HttpStatus.FORBIDDEN);
  }
}

@Injectable()
export class DynamicPermissionGuard implements CanActivate {
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

    const resolver = this.reflector.getAllAndOverride<DynamicPermissionResolver>(DYNAMIC_PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const required = resolver?.(request) ?? [];

    if (hasPermissions(principal, required)) {
      return true;
    }

    await this.auditService.record(permissionDenyAudit(request, context, required));
    throw new AppException('RBAC_FORBIDDEN', 'Forbidden', HttpStatus.FORBIDDEN);
  }
}

function hasPermissions(principal: StaffPrincipal, required: string[]): boolean {
  return required.length === 0 || required.every((permission) => principal.permissions?.includes(permission));
}

function permissionDenyAudit(
  request: AuthenticatedRequest,
  context: ExecutionContext,
  requiredPermissions: string[],
): AuditRecordInput {
  const principal = request.principal;
  const method = safeAuditText(request.method?.toUpperCase() ?? null);
  const path = requestPath(request);
  const correlationId = request.correlationId ?? headerValue(request.headers['x-correlation-id']);
  const ipAddress = headerValue(request.headers['x-forwarded-for'])?.split(',')[0]?.trim()
    ?? request.socket?.remoteAddress
    ?? null;
  const userAgent = safeAuditText(headerValue(request.headers['user-agent']));
  return {
    eventType: 'SECURITY',
    action: 'permission_forbidden',
    actorId: principal?.userId ?? null,
    branchId: principal?.branchId ?? null,
    targetType: 'api_route',
    targetId: path,
    correlationId,
    ipAddress,
    userAgent,
    metadata: {
      actorId: principal?.userId ?? null,
      branchId: principal?.branchId ?? null,
      requiredPermissions: requiredPermissions.map(safeAuditText),
      method,
      path,
      handler: safeAuditText(handlerTarget(context)),
      correlationId,
      ipAddress,
      userAgent,
    },
  };
}

function requestPath(request: AuthenticatedRequest): string {
  return new URL(request.url ?? '/', 'http://localhost').pathname;
}

function handlerTarget(context: ExecutionContext): string {
  const className = context.getClass()?.name || 'UnknownController';
  const handlerName = context.getHandler()?.name || 'unknownHandler';
  return `${className}.${handlerName}`;
}

const sensitiveAuditValue = /password|otp|token|hash|secret|credential|provider/i;

function safeAuditText(value: string | null): string {
  if (!value) return '';
  return sensitiveAuditValue.test(value) ? '[REDACTED]' : value;
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

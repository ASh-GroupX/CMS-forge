import { CanActivate, ExecutionContext, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { AuditService } from '../../core/audit.service.js';
import type { AuthenticatedRequest } from '../../core/auth.guard.js';
import { AppException } from '../../core/http-kernel.js';

const QR_NAV_KEY = 'admin:portal-intake';

@Injectable()
export class PortalIntakeAccessGuard implements CanActivate {
  constructor(@Inject(AuditService) private readonly audit: AuditService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const principal = request.principal;
    if (!principal) {
      throw new AppException('AUTH_INVALID_CREDENTIALS', 'Invalid credentials', HttpStatus.UNAUTHORIZED);
    }
    if (principal.roleCode === 'ADMIN' ||
        (principal.viewMode === 'CUSTOM' && principal.allowedNavKeys?.includes('admin') &&
          principal.allowedNavKeys.includes(QR_NAV_KEY))) {
      return true;
    }

    await this.audit.record({
      eventType: 'SECURITY',
      action: 'rbac_forbidden',
      actorId: principal.userId,
      branchId: principal.branchId,
      targetType: 'api_route',
      targetId: request.url?.split('?')[0] ?? '/admin/portal-intake-settings',
      correlationId: request.correlationId ?? null,
      ipAddress: typeof request.headers['x-forwarded-for'] === 'string'
        ? request.headers['x-forwarded-for'].split(',')[0]?.trim() ?? null : request.socket?.remoteAddress ?? null,
      userAgent: typeof request.headers['user-agent'] === 'string' ? request.headers['user-agent'] : null,
    });
    throw new AppException('RBAC_FORBIDDEN', 'Forbidden', HttpStatus.FORBIDDEN);
  }
}

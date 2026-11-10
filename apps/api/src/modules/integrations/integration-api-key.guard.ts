import { CanActivate, ExecutionContext, HttpStatus, Inject, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuditService } from '../../core/audit.service.js';
import { AppException } from '../../core/http-kernel.js';
import { IntegrationsRepository } from './integrations.repository.js';
import { hashApiKey, type DataApiKeyScope } from './integrations.service.js';

const REQUIRED_SCOPES = 'cms:auto:integration-api-scopes';
export type IntegrationApiKeyPrincipal = {
  keyId: string; name: string; createdById: string; scopes: DataApiKeyScope[];
  branchIds: string[]; allBranches: boolean;
};
export type IntegrationApiRequest = {
  headers: Record<string, string | string[] | undefined>;
  method?: string;
  query?: Record<string, unknown>;
  url?: string;
  socket?: { remoteAddress?: string };
  correlationId?: string;
  integrationApiKey?: IntegrationApiKeyPrincipal;
};

export function IntegrationApiScopes(...scopes: DataApiKeyScope[]) {
  return SetMetadata(REQUIRED_SCOPES, scopes);
}

@Injectable()
export class IntegrationApiKeyGuard implements CanActivate {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    private readonly repository: IntegrationsRepository,
    private readonly audit: AuditService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<IntegrationApiRequest>();
    if (request.method?.toUpperCase() !== 'GET') {
      await this.audit.record({
        eventType: 'SECURITY', action: 'integration_api_write_rejected', actorId: null, branchId: null,
        targetType: 'integration_api_route', targetId: request.url?.split('?')[0] ?? null,
        correlationId: request.correlationId ?? null,
        ipAddress: headerValue(request.headers['x-forwarded-for'])?.split(',')[0]?.trim() ?? request.socket?.remoteAddress ?? null,
        userAgent: headerValue(request.headers['user-agent']) ?? null,
      });
      throw new AppException('RBAC_FORBIDDEN', 'Integration keys are read-only', HttpStatus.FORBIDDEN);
    }
    const secret = bearerToken(headerValue(request.headers.authorization));
    if (!secret) throw invalidKey();
    const key = await this.repository.findActiveApiKeyByHash(hashApiKey(secret));
    if (!key) throw invalidKey();

    const requiredScopes = this.reflector.getAllAndOverride<DataApiKeyScope[]>(REQUIRED_SCOPES, [
      context.getHandler(), context.getClass(),
    ]) ?? [];
    const missingScope = requiredScopes.some((scope) => !key.scopes.includes(scope));
    const rawBranchId = request.query?.branchId;
    const requestedBranchId = stringQuery(rawBranchId);
    const branchDenied = rawBranchId !== undefined && (requestedBranchId === null || (!key.allBranches && !key.branchIds.includes(requestedBranchId)));
    if (missingScope || branchDenied) {
      await this.audit.record({
        eventType: 'SECURITY', action: missingScope ? 'integration_api_key_scope_denied' : 'integration_api_key_branch_denied',
        actorId: key.createdById, branchId: null,
        targetType: 'integration_api_key', targetId: key.id, correlationId: request.correlationId ?? null,
        ipAddress: headerValue(request.headers['x-forwarded-for'])?.split(',')[0]?.trim() ?? request.socket?.remoteAddress ?? null,
        userAgent: headerValue(request.headers['user-agent']) ?? null,
        metadata: { requiredScopes, requestedBranchId },
      });
      throw new AppException('RBAC_FORBIDDEN', 'Integration key is not authorized for this resource or branch', HttpStatus.FORBIDDEN);
    }

    if (!await this.repository.markApiKeyUsed(key.id)) throw invalidKey();
    request.integrationApiKey = {
      keyId: key.id, name: key.name, createdById: key.createdById,
      scopes: key.scopes as DataApiKeyScope[], branchIds: key.branchIds, allBranches: key.allBranches,
    };
    return true;
  }
}

function bearerToken(value: string | null): string | null {
  const match = value?.match(/^Bearer\s+(cms_live_[A-Za-z0-9_-]{40,})$/i);
  return match?.[1] ?? null;
}

function stringQuery(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function headerValue(value: string | string[] | undefined): string | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function invalidKey(): AppException {
  return new AppException('AUTH_INVALID_CREDENTIALS', 'Invalid integration credentials', HttpStatus.UNAUTHORIZED);
}

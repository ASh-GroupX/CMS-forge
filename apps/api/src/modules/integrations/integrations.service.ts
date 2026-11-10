import { Inject, Injectable, Optional } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { AuditService } from '../../core/audit.service.js';
import type { AuditRecordInput } from '../../core/audit.service.js';
import { AppException } from '../../core/http-kernel.js';
import { HttpStatus } from '@nestjs/common';
import { BranchesService } from '../branches/branches.service.js';
import {
  DMS_PROVIDER,
  InMemoryDmsProvider,
  normalizeDmsLookupResult,
  validateDmsLookupQuery,
} from './dms-provider.port.js';
import type { DmsLookupQuery, DmsLookupResult, DmsProviderPort } from './dms-provider.port.js';
import { EMAIL_PROVIDER, validateEmailMessage } from './email-provider.port.js';
import type { EmailMessageInput, EmailProviderPort, EmailSendResult } from './email-provider.port.js';
import { IntegrationsRepository } from './integrations.repository.js';
import type { IntegrationApiKeyCreateData, IntegrationApiKeyRecord } from './integrations.repository.js';
import { SMS_PROVIDER, validateSmsMessage } from './sms-provider.port.js';
import type { SmsMessageInput, SmsProviderPort, SmsSendResult } from './sms-provider.port.js';
import { validateWhatsAppMessage, WHATSAPP_PROVIDER } from './whatsapp-provider.port.js';
import type { WhatsAppMessageInput, WhatsAppProviderPort, WhatsAppSendResult } from './whatsapp-provider.port.js';

@Injectable()
export class IntegrationsService {
  constructor(
    private readonly integrationsRepository: IntegrationsRepository,
    @Inject(EMAIL_PROVIDER) private readonly emailProvider: EmailProviderPort,
    @Inject(SMS_PROVIDER) private readonly smsProvider: SmsProviderPort,
    @Inject(WHATSAPP_PROVIDER) private readonly whatsAppProvider: WhatsAppProviderPort,
    @Optional()
    @Inject(DMS_PROVIDER)
    private readonly dmsProvider: DmsProviderPort = new InMemoryDmsProvider(),
    @Optional()
    private readonly auditService?: AuditService,
    @Optional()
    private readonly branchesService?: BranchesService,
  ) {}

  async sendEmail(input: EmailMessageInput): Promise<EmailSendResult> {
    const message = validateEmailMessage(input);
    return this.emailProvider.send(message);
  }

  async sendSms(input: SmsMessageInput): Promise<SmsSendResult> {
    const message = validateSmsMessage(input);
    return this.smsProvider.send(message);
  }

  async sendWhatsApp(input: WhatsAppMessageInput): Promise<WhatsAppSendResult> {
    const message = validateWhatsAppMessage(input);
    return this.whatsAppProvider.send(message);
  }

  async lookupDmsCustomerVehicle(input: DmsLookupQuery): Promise<DmsLookupResult> {
    const query = validateDmsLookupQuery(input);
    const startedAt = Date.now();

    try {
      const response = await this.dmsProvider.lookupCustomerVehicle(query);
      return normalizeDmsLookupResult(response, query, Date.now() - startedAt);
    } catch {
      return normalizeDmsLookupResult({ status: 'PROVIDER_DOWN' }, query, Date.now() - startedAt);
    }
  }

  async createDataApiKey(body: unknown, audit: IntegrationKeyAuditContext): Promise<{ key: SafeIntegrationApiKey; secret: string }> {
    const input = parseCreateDataApiKey(body);
    const secret = `cms_live_${randomBytes(32).toString('base64url')}`;
    const data: IntegrationApiKeyCreateData = {
      name: input.name,
      keyPrefix: secret.slice(0, 18),
      tokenHash: hashApiKey(secret),
      scopes: input.scopes,
      branchIds: input.branchIds,
      allBranches: input.allBranches,
      createdBy: { connect: { id: requiredActor(audit.actorId) } },
    };

    const record = await this.integrationsRepository.transaction(async (client) => {
      if (!input.allBranches && !await this.hasActiveBranches(input.branchIds)) {
        throw validation('branchIds', 'Select one or more active branches.');
      }
      const created = await this.integrationsRepository.createApiKey(data, client);
      await this.requireAuditService().record(apiKeyAudit('integration_data_api_key_created', created, audit), client);
      return created;
    });
    return { key: safeApiKey(record), secret };
  }

  async listDataApiKeys(): Promise<SafeIntegrationApiKey[]> {
    return (await this.integrationsRepository.listApiKeys()).map(safeApiKey);
  }

  async revokeDataApiKey(id: string, audit: IntegrationKeyAuditContext): Promise<{ revoked: boolean }> {
    const keyId = nonEmpty(id, 'id');
    const revoked = await this.integrationsRepository.transaction(async (client) => {
      const key = await this.integrationsRepository.findApiKeyById(keyId, client);
      const changed = await this.integrationsRepository.revokeApiKey(keyId, client);
      if (changed) {
        await this.requireAuditService().record({
          eventType: 'CONFIG', action: 'integration_data_api_key_revoked', actorId: audit.actorId ?? null,
          targetType: 'integration_api_key', targetId: keyId,
          correlationId: audit.correlationId ?? null, ipAddress: audit.ipAddress ?? null,
          userAgent: audit.userAgent ?? null,
          metadata: key ? { name: key.name, keyPrefix: key.keyPrefix, scopes: key.scopes, branchIds: key.branchIds, allBranches: key.allBranches } : {},
        }, client);
      }
      return changed;
    });
    return { revoked };
  }

  private requireAuditService(): AuditService {
    if (!this.auditService) throw new Error('AuditService is required for integration API key changes');
    return this.auditService;
  }

  private async hasActiveBranches(branchIds: string[]): Promise<boolean> {
    if (!this.branchesService) throw new Error('BranchesService is required to validate API key branch scope');
    const activeIds = new Set((await this.branchesService.listActive()).map((branch) => branch.id));
    return branchIds.every((id) => activeIds.has(id));
  }
}

export const DATA_API_KEY_SCOPES = ['customers:read', 'complaints:read', 'tasks:read', 'appointments:read', 'tickets:read'] as const;
export type DataApiKeyScope = (typeof DATA_API_KEY_SCOPES)[number];
export type SafeIntegrationApiKey = Omit<IntegrationApiKeyRecord, 'createdAt' | 'lastUsedAt' | 'revokedAt'> & {
  createdAt: string; lastUsedAt: string | null; revokedAt: string | null;
};
export type IntegrationKeyAuditContext = {
  actorId?: string | null; correlationId?: string | null; ipAddress?: string | null; userAgent?: string | null;
};

function parseCreateDataApiKey(body: unknown): { name: string; scopes: DataApiKeyScope[]; branchIds: string[]; allBranches: boolean } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw validation('body', 'A JSON object is required.');
  const value = body as Record<string, unknown>;
  const name = typeof value.name === 'string' ? value.name.trim() : '';
  if (!name || name.length > 100) throw validation('name', 'Name must contain 1 to 100 characters.');
  if (!Array.isArray(value.scopes) || value.scopes.length === 0 || value.scopes.some((scope) => !DATA_API_KEY_SCOPES.includes(scope as DataApiKeyScope))) {
    throw validation('scopes', 'Select one or more supported read-only scopes.');
  }
  const scopes = [...new Set(value.scopes as DataApiKeyScope[])];
  const allBranches = value.allBranches === true;
  const branchIds = Array.isArray(value.branchIds) && value.branchIds.every((id) => typeof id === 'string' && id.trim())
    ? [...new Set((value.branchIds as string[]).map((id) => id.trim()))]
    : [];
  if (branchIds.length > 100) throw validation('branchIds', 'At most 100 branch ids may be selected.');
  if (value.allBranches !== undefined && typeof value.allBranches !== 'boolean') throw validation('allBranches', 'Must be a boolean.');
  if (allBranches ? branchIds.length > 0 : branchIds.length === 0) throw validation('branchIds', 'Choose all branches or one or more branch ids.');
  return { name, scopes, branchIds, allBranches };
}

export function hashApiKey(secret: string): string {
  return createHash('sha256').update(secret).digest('hex');
}

function safeApiKey(record: IntegrationApiKeyRecord): SafeIntegrationApiKey {
  return {
    id: record.id, name: record.name, keyPrefix: record.keyPrefix, scopes: record.scopes,
    branchIds: record.branchIds, allBranches: record.allBranches, createdById: record.createdById,
    createdAt: record.createdAt.toISOString(), lastUsedAt: record.lastUsedAt?.toISOString() ?? null,
    revokedAt: record.revokedAt?.toISOString() ?? null,
  };
}

function apiKeyAudit(action: string, record: IntegrationApiKeyRecord, context: IntegrationKeyAuditContext): AuditRecordInput {
  return {
    eventType: 'CONFIG', action, actorId: context.actorId ?? null, targetType: 'integration_api_key', targetId: record.id,
    correlationId: context.correlationId ?? null, ipAddress: context.ipAddress ?? null, userAgent: context.userAgent ?? null,
    metadata: { name: record.name, keyPrefix: record.keyPrefix, scopes: record.scopes, branchIds: record.branchIds, allBranches: record.allBranches },
  };
}

function requiredActor(actorId: string | null | undefined): string {
  if (actorId) return actorId;
  throw new AppException('AUTH_INVALID_CREDENTIALS', 'Administrator session required', HttpStatus.UNAUTHORIZED);
}

function nonEmpty(value: string, field: string): string {
  const trimmed = value.trim();
  if (!trimmed) throw validation(field, 'This value is required.');
  return trimmed;
}

function validation(field: string, message: string): AppException {
  return new AppException('VALIDATION_FAILED', 'Invalid integration API key request', HttpStatus.BAD_REQUEST,
    [{ field, code: 'INVALID', message }]);
}

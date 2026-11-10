import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/http-kernel.js';

const apiKeySelect = {
  id: true, name: true, keyPrefix: true, scopes: true, branchIds: true,
  allBranches: true, createdById: true, createdAt: true, lastUsedAt: true, revokedAt: true,
} satisfies Prisma.IntegrationApiKeySelect;

const apiKeyAuthSelect = { ...apiKeySelect, tokenHash: true } satisfies Prisma.IntegrationApiKeySelect;
export type IntegrationApiKeyRecord = Prisma.IntegrationApiKeyGetPayload<{ select: typeof apiKeySelect }>;
export type IntegrationApiKeyAuthRecord = Prisma.IntegrationApiKeyGetPayload<{ select: typeof apiKeyAuthSelect }>;
export type IntegrationApiKeyCreateData = Pick<Prisma.IntegrationApiKeyCreateInput,
  'name' | 'keyPrefix' | 'tokenHash' | 'scopes' | 'branchIds' | 'allBranches' | 'createdBy'>;
type IntegrationClient = Pick<Prisma.TransactionClient, 'integrationApiKey'>;

@Injectable()
export class IntegrationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async transaction<T>(work: (client: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(work);
  }

  async listApiKeys(): Promise<IntegrationApiKeyRecord[]> {
    return this.prisma.integrationApiKey.findMany({ orderBy: { createdAt: 'desc' }, select: apiKeySelect });
  }

  async createApiKey(data: IntegrationApiKeyCreateData, client: IntegrationClient = this.prisma): Promise<IntegrationApiKeyRecord> {
    return client.integrationApiKey.create({ data, select: apiKeySelect });
  }

  async findActiveApiKeyByHash(tokenHash: string): Promise<IntegrationApiKeyAuthRecord | null> {
    return this.prisma.integrationApiKey.findFirst({ where: { tokenHash, revokedAt: null }, select: apiKeyAuthSelect });
  }

  async findApiKeyById(id: string, client: IntegrationClient = this.prisma): Promise<IntegrationApiKeyRecord | null> {
    return client.integrationApiKey.findUnique({ where: { id }, select: apiKeySelect });
  }

  async markApiKeyUsed(id: string): Promise<boolean> {
    const result = await this.prisma.integrationApiKey.updateMany({ where: { id, revokedAt: null }, data: { lastUsedAt: new Date() } });
    return result.count > 0;
  }

  async revokeApiKey(id: string, client: IntegrationClient = this.prisma): Promise<boolean> {
    const result = await client.integrationApiKey.updateMany({
      where: { id, revokedAt: null }, data: { revokedAt: new Date() },
    });
    return result.count > 0;
  }
}

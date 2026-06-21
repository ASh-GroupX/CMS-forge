import { HttpStatus, Injectable } from '@nestjs/common';
import { AuditService } from '../../core/audit.service.js';
import type { AuditRecordInput } from '../../core/audit.service.js';
import { AppException } from '../../core/http-kernel.js';
import { AdminCategoriesRepository } from './admin-categories.repository.js';
import type { AdminCategoryData, AdminCategoryRecord } from './admin-categories.repository.js';

export type AdminCategoryDto = {
  id: string; code: string; nameEn: string; nameAr: string; parentId: string | null; isActive: boolean;
};
export type AdminCategoryInput = { code: string; nameEn: string; nameAr: string; parentId?: string | null };
type AdminAudit = { actorId?: string | null; correlationId?: string | null; ipAddress?: string | null; userAgent?: string | null };

@Injectable()
export class AdminCategoriesService {
  constructor(private readonly repository: AdminCategoriesRepository, private readonly audit: AuditService) {}

  async create(input: AdminCategoryInput, audit: AdminAudit = {}): Promise<AdminCategoryDto> {
    const data = await this.data(input);
    return this.repository.transaction(async (client) => {
      const category = await this.repository.create(data, client);
      await this.audit.record(auditInput('admin_category_created', category, audit, data), client);
      return dto(category);
    });
  }

  async update(id: string, input: AdminCategoryInput, audit: AdminAudit = {}): Promise<AdminCategoryDto> {
    const data = await this.data(input, nonEmpty(id, 'id'));
    return this.repository.transaction(async (client) => {
      const category = await this.repository.update(id, data, client);
      await this.audit.record(auditInput('admin_category_updated', category, audit, data), client);
      return dto(category);
    });
  }

  private async data(input: AdminCategoryInput, id?: string): Promise<AdminCategoryData> {
    const parentId = optionalText(input.parentId, 'parentId');
    if (parentId && parentId === id) throw validation('parentId', 'parentId cannot be the same category.');
    if (parentId && !(await this.repository.parentExists(parentId))) throw validation('parentId', 'parentId is invalid.');
    return { code: nonEmpty(input.code, 'code'), nameEn: nonEmpty(input.nameEn, 'nameEn'), nameAr: nonEmpty(input.nameAr, 'nameAr'), parentId };
  }
}

function dto(category: AdminCategoryRecord): AdminCategoryDto {
  return {
    id: category.id,
    code: category.code,
    nameEn: category.nameEn,
    nameAr: category.nameAr,
    parentId: category.parentId,
    isActive: category.isActive,
  };
}

function auditInput(action: string, category: AdminCategoryRecord, audit: AdminAudit, metadata: Record<string, unknown>): AuditRecordInput {
  return {
    eventType: 'CONFIG',
    action,
    actorId: audit.actorId ?? null,
    branchId: null,
    targetType: 'category',
    targetId: category.id,
    correlationId: audit.correlationId ?? null,
    ipAddress: audit.ipAddress ?? null,
    userAgent: audit.userAgent ?? null,
    metadata: { changedFields: Object.keys(metadata), ...metadata },
  };
}

function nonEmpty(value: string | undefined | null, field: string): string {
  const text = value?.trim() ?? '';
  if (!text) throw validation(field, `${field} is required.`);
  return text;
}

function optionalText(value: string | undefined | null, field: string): string | null {
  const text = value?.trim() ?? '';
  return text ? nonEmpty(text, field) : null;
}

function validation(field: string, message: string): AppException {
  return new AppException('VALIDATION_FAILED', 'Invalid admin category request', HttpStatus.BAD_REQUEST, [{ field, code: 'REQUIRED', message }]);
}

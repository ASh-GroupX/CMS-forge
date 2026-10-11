import { HttpStatus, Injectable } from '@nestjs/common';
import { AuditService } from '../../core/audit.service.js';
import type { AuditRecordInput } from '../../core/audit.service.js';
import { AppException } from '../../core/http-kernel.js';
import { AdminDepartmentsRepository } from './admin-departments.repository.js';
import type { AdminDepartmentData, AdminDepartmentRecord } from './admin-departments.repository.js';

export type AdminDepartmentInput = { code: string; nameEn: string; nameAr: string };
export type AdminDepartmentDto = {
  id: string; code: string; nameEn: string; nameAr: string; branchId: null; isActive: boolean;
};
type AdminAudit = { actorId?: string | null; correlationId?: string | null; ipAddress?: string | null; userAgent?: string | null };

@Injectable()
export class AdminDepartmentsService {
  constructor(private readonly repository: AdminDepartmentsRepository, private readonly audit: AuditService) {}

  async createTopLevel(input: AdminDepartmentInput, context: AdminAudit = {}): Promise<AdminDepartmentDto> {
    const data: AdminDepartmentData = {
      code: required(input.code, 'code'),
      nameEn: required(input.nameEn, 'nameEn'),
      nameAr: required(input.nameAr, 'nameAr'),
      branchId: null,
    };
    return this.repository.transaction(async (client) => {
      const department = await this.repository.create(data, client);
      await this.audit.record(auditInput(department, context), client);
      return dto(department);
    });
  }
}

function dto(department: AdminDepartmentRecord): AdminDepartmentDto {
  return {
    id: department.id,
    code: department.code,
    nameEn: department.nameEn,
    nameAr: department.nameAr,
    branchId: null,
    isActive: department.isActive,
  };
}

function required(value: string, field: string): string {
  const text = value.trim();
  if (!text) {
    throw new AppException('VALIDATION_FAILED', 'Invalid admin department request', HttpStatus.BAD_REQUEST, [
      { field, code: 'REQUIRED', message: `${field} is required.` },
    ]);
  }
  return text;
}

function auditInput(department: AdminDepartmentRecord, context: AdminAudit): AuditRecordInput {
  return {
    eventType: 'CONFIG',
    action: 'admin_department_created',
    actorId: context.actorId ?? null,
    branchId: null,
    targetType: 'department',
    targetId: department.id,
    correlationId: context.correlationId ?? null,
    ipAddress: context.ipAddress ?? null,
    userAgent: context.userAgent ?? null,
    metadata: { changedFields: ['code', 'nameEn', 'nameAr', 'branchId'], scope: 'top-level' },
  };
}

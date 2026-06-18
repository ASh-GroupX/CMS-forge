import { Injectable } from '@nestjs/common';
import { AuditService } from '../../core/audit.service.js';
import type { AuditRecordInput } from '../../core/audit.service.js';
import { AppException } from '../../core/http-kernel.js';
import { BranchesRepository } from './branches.repository.js';
import type { BranchRecord } from './branches.repository.js';
import type { CreateBranchData, UpdateBranchData } from './branches.repository.js';
import type { BranchResponseDto } from './dto/branch-response.dto.js';

type BranchAuditContext = {
  actorId?: string | null;
  correlationId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

@Injectable()
export class BranchesService {
  constructor(
    private readonly branchesRepository: BranchesRepository,
    private readonly auditService: AuditService,
  ) {}

  async listActive(): Promise<BranchResponseDto[]> {
    const branches = await this.branchesRepository.listActive();
    return branches.map(toResponse);
  }

  async findByIdOrCode(idOrCode: string): Promise<BranchResponseDto | null> {
    const branch = await this.branchesRepository.findByIdOrCode(idOrCode);
    return branch ? toResponse(branch) : null;
  }

  async create(input: CreateBranchData, audit: BranchAuditContext = {}): Promise<BranchResponseDto> {
    const data = createData(input);
    return this.branchesRepository.transaction(async (client) => {
      const branch = await this.branchesRepository.create(data, client);
      await this.auditService.record(auditInput('branch_created', branch, audit, data), client);
      return toResponse(branch);
    });
  }

  async update(id: string, input: UpdateBranchData, audit: BranchAuditContext = {}): Promise<BranchResponseDto> {
    const data = updateData(input);
    return this.branchesRepository.transaction(async (client) => {
      const branch = await this.branchesRepository.update(nonEmpty(id, 'id'), data, client);
      await this.auditService.record(auditInput('branch_updated', branch, audit, data), client);
      return toResponse(branch);
    });
  }

  async deactivate(id: string, audit: BranchAuditContext = {}): Promise<BranchResponseDto> {
    return this.branchesRepository.transaction(async (client) => {
      const branch = await this.branchesRepository.deactivate(nonEmpty(id, 'id'), client);
      await this.auditService.record(auditInput('branch_deactivated', branch, audit), client);
      return toResponse(branch);
    });
  }
}

function toResponse(branch: BranchRecord): BranchResponseDto {
  return {
    id: branch.id,
    code: branch.code,
    nameEn: branch.nameEn,
    nameAr: branch.nameAr,
    timezone: branch.timezone,
    isActive: branch.isActive,
    createdAt: branch.createdAt.toISOString(),
    updatedAt: branch.updatedAt.toISOString(),
  };
}

function createData(input: CreateBranchData): CreateBranchData {
  const data = {
    code: nonEmpty(input.code, 'code'),
    nameEn: nonEmpty(input.nameEn, 'nameEn'),
    nameAr: nonEmpty(input.nameAr, 'nameAr'),
  };
  const timezone = optionalText(input.timezone, 'timezone');
  return timezone ? { ...data, timezone } : data;
}

function updateData(input: UpdateBranchData): UpdateBranchData {
  const data: UpdateBranchData = {};
  for (const field of ['code', 'nameEn', 'nameAr', 'timezone'] as const) {
    const value = input[field];
    if (value !== undefined) {
      data[field] = nonEmpty(value, field);
    }
  }
  if (Object.keys(data).length === 0) {
    throw validation('body', 'At least one branch field is required.');
  }
  return data;
}

function nonEmpty(value: string, field: string): string {
  const text = value.trim();
  if (!text) {
    throw validation(field, `${field} is required.`);
  }
  return text;
}

function optionalText(value: string | undefined, field: string): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  return nonEmpty(value, field);
}

function validation(field: string, message: string): AppException {
  return new AppException('VALIDATION_FAILED', 'Invalid branch request', 400, [
    { field, code: 'REQUIRED', message },
  ]);
}

function auditInput(
  action: string,
  branch: BranchRecord,
  context: BranchAuditContext,
  metadata?: Record<string, unknown>,
): AuditRecordInput {
  const input: AuditRecordInput = {
    eventType: 'CONFIG' as const,
    action,
    actorId: context.actorId ?? null,
    branchId: branch.id,
    targetType: 'branch',
    targetId: branch.id,
    correlationId: context.correlationId ?? null,
    ipAddress: context.ipAddress ?? null,
    userAgent: context.userAgent ?? null,
  };
  return metadata ? { ...input, metadata: { changedFields: Object.keys(metadata) } } : input;
}

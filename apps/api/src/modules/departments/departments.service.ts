import { Injectable } from '@nestjs/common';
import { AuditService } from '../../core/audit.service.js';
import type { AuditRecordInput } from '../../core/audit.service.js';
import { AppException } from '../../core/http-kernel.js';
import { DepartmentsRepository } from './departments.repository.js';
import type { DepartmentRecord, StandardProblemRecord } from './departments.repository.js';
import type { CreateDepartmentData, UpdateDepartmentData } from './departments.repository.js';
import type { DepartmentResponseDto } from './dto/department-response.dto.js';
import type { StandardProblemDto, CreateStandardProblemDto, UpdateStandardProblemDto } from './dto/standard-problem.dto.js';

type DepartmentAuditContext = {
  actorId?: string | null;
  correlationId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

@Injectable()
export class DepartmentsService {
  constructor(
    private readonly departmentsRepository: DepartmentsRepository,
    private readonly auditService: AuditService,
  ) {}

  async listActive(): Promise<DepartmentResponseDto[]> {
    const departments = await this.departmentsRepository.listActive();
    return departments.map(toResponse);
  }

  async findByIdOrCode(idOrCode: string): Promise<DepartmentResponseDto | null> {
    const department = await this.departmentsRepository.findByIdOrCode(idOrCode);
    return department ? toResponse(department) : null;
  }

  async create(input: CreateDepartmentData, audit: DepartmentAuditContext = {}): Promise<DepartmentResponseDto> {
    const data = createData(input);
    return this.departmentsRepository.transaction(async (client) => {
      const department = await this.departmentsRepository.create(data, client);
      await this.auditService.record(auditInput('department_created', department, audit, data), client);
      return toResponse(department);
    });
  }

  async update(id: string, input: UpdateDepartmentData, audit: DepartmentAuditContext = {}): Promise<DepartmentResponseDto> {
    const data = updateData(input);
    return this.departmentsRepository.transaction(async (client) => {
      const department = await this.departmentsRepository.update(nonEmpty(id, 'id'), data, client);
      await this.auditService.record(auditInput('department_updated', department, audit, data), client);
      return toResponse(department);
    });
  }

  async deactivate(id: string, audit: DepartmentAuditContext = {}): Promise<DepartmentResponseDto> {
    return this.departmentsRepository.transaction(async (client) => {
      const department = await this.departmentsRepository.deactivate(nonEmpty(id, 'id'), client);
      await this.auditService.record(auditInput('department_deactivated', department, audit), client);
      return toResponse(department);
    });
  }

  async delete(id: string, audit: DepartmentAuditContext = {}): Promise<DepartmentResponseDto> {
    return this.departmentsRepository.transaction(async (client) => {
      const department = await this.departmentsRepository.delete(nonEmpty(id, 'id'), client);
      await this.auditService.record(auditInput('department_deleted', department, audit), client);
      return toResponse(department);
    });
  }

  // Standard Problems
  async listStandardProblems(departmentId: string): Promise<StandardProblemDto[]> {
    const problems = await this.departmentsRepository.findStandardProblems(departmentId);
    return problems.map(toStandardProblemResponse);
  }

  async createStandardProblem(departmentId: string, input: CreateStandardProblemDto, audit: DepartmentAuditContext = {}): Promise<StandardProblemDto> {
    const data = { titleEn: nonEmpty(input.titleEn, 'titleEn'), titleAr: nonEmpty(input.titleAr, 'titleAr'), categoryId: nonEmpty(input.categoryId, 'categoryId') };
    return this.departmentsRepository.transaction(async (client) => {
      const problem = await this.departmentsRepository.createStandardProblem(departmentId, data, client);
      await this.auditService.record(auditStandardProblemInput('standard_problem_created', problem, audit, data), client);
      return toStandardProblemResponse(problem);
    });
  }

  async updateStandardProblem(id: string, input: UpdateStandardProblemDto, audit: DepartmentAuditContext = {}): Promise<StandardProblemDto> {
    const data: any = {};
    if (input.titleEn !== undefined) data.titleEn = nonEmpty(input.titleEn, 'titleEn');
    if (input.titleAr !== undefined) data.titleAr = nonEmpty(input.titleAr, 'titleAr');
    if (input.isActive !== undefined) data.isActive = input.isActive;

    if (Object.keys(data).length === 0) {
      throw validation('body', 'At least one field is required.');
    }

    return this.departmentsRepository.transaction(async (client) => {
      const problem = await this.departmentsRepository.updateStandardProblem(nonEmpty(id, 'id'), data, client);
      await this.auditService.record(auditStandardProblemInput('standard_problem_updated', problem, audit, data), client);
      return toStandardProblemResponse(problem);
    });
  }

  async deleteStandardProblem(id: string, audit: DepartmentAuditContext = {}): Promise<StandardProblemDto> {
    return this.departmentsRepository.transaction(async (client) => {
      const problem = await this.departmentsRepository.deleteStandardProblem(nonEmpty(id, 'id'), client);
      await this.auditService.record(auditStandardProblemInput('standard_problem_deleted', problem, audit), client);
      return toStandardProblemResponse(problem);
    });
  }
}

function toResponse(department: DepartmentRecord): DepartmentResponseDto {
  return {
    id: department.id,
    code: department.code,
    nameEn: department.nameEn,
    nameAr: department.nameAr,
    branchId: department.branchId,
    isActive: department.isActive,
    createdAt: department.createdAt.toISOString(),
    updatedAt: department.updatedAt.toISOString(),
  };
}

function toStandardProblemResponse(problem: StandardProblemRecord): StandardProblemDto {
  return {
    id: problem.id,
    departmentId: problem.departmentId,
    categoryId: problem.categoryId,
    titleEn: problem.titleEn,
    titleAr: problem.titleAr,
    isActive: problem.isActive,
  };
}

function createData(input: CreateDepartmentData): CreateDepartmentData {
  const data = {
    code: nonEmpty(input.code, 'code'),
    nameEn: nonEmpty(input.nameEn, 'nameEn'),
    nameAr: nonEmpty(input.nameAr, 'nameAr'),
    branchId: input.branchId !== undefined ? input.branchId : null,
  };
  return data;
}

function updateData(input: UpdateDepartmentData): UpdateDepartmentData {
  const data: UpdateDepartmentData = {};
  for (const field of ['code', 'nameEn', 'nameAr'] as const) {
    const value = input[field];
    if (value !== undefined) {
      data[field] = nonEmpty(value, field);
    }
  }
  if (input.branchId !== undefined) { data.branchId = input.branchId || null; }
  if (Object.keys(data).length === 0) {
    throw validation('body', 'At least one department field is required.');
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
  return new AppException('VALIDATION_FAILED', 'Invalid department request', 400, [
    { field, code: 'REQUIRED', message },
  ]);
}

function auditInput(
  action: string,
  department: DepartmentRecord,
  context: DepartmentAuditContext,
  metadata?: Record<string, unknown>,
): AuditRecordInput {
  const input: AuditRecordInput = {
    eventType: 'CONFIG' as const,
    action,
    actorId: context.actorId ?? null,
    targetType: 'department',
    targetId: department.id,
    correlationId: context.correlationId ?? null,
    ipAddress: context.ipAddress ?? null,
    userAgent: context.userAgent ?? null,
  };
  return metadata ? { ...input, metadata: { changedFields: Object.keys(metadata) } } : input;
}

function auditStandardProblemInput(
  action: string,
  problem: StandardProblemRecord,
  context: DepartmentAuditContext,
  metadata?: Record<string, unknown>,
): AuditRecordInput {
  const input: AuditRecordInput = {
    eventType: 'CONFIG' as const,
    action,
    actorId: context.actorId ?? null,
    targetType: 'standard_problem',
    targetId: problem.id,
    correlationId: context.correlationId ?? null,
    ipAddress: context.ipAddress ?? null,
    userAgent: context.userAgent ?? null,
  };
  return metadata ? { ...input, metadata: { changedFields: Object.keys(metadata) } } : input;
}

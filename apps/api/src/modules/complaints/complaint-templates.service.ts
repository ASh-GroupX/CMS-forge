import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { AppException } from '../../core/http-kernel.js';
import { ComplaintsRepository } from './complaints.repository.js';
import type { CreateComplaintTemplateDto, UpdateComplaintTemplateDto, ComplaintTemplateResponseDto } from './dto/complaint-template.dto.js';
import { AuditService } from '../../core/audit.service.js';

@Injectable()
export class ComplaintTemplatesService {
  constructor(
    private readonly complaintsRepository: ComplaintsRepository,
    private readonly auditService: AuditService
  ) {}

  async list(departmentId: string): Promise<ComplaintTemplateResponseDto[]> {
    return this.complaintsRepository.transaction(async (client) => {
      const items = await client.departmentComplaintTemplate.findMany({
        where: { departmentId },
        orderBy: { name: 'asc' },
      });
      return items.map(item => ({
        id: item.id,
        departmentId: item.departmentId,
        name: item.name,
        description: item.description,
        isActive: item.isActive,
        schema: item.schema,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }));
    });
  }

  async create(departmentId: string, actorId: string | null, input: CreateComplaintTemplateDto): Promise<ComplaintTemplateResponseDto> {
    return this.complaintsRepository.transaction(async (client) => {
      const template = await client.departmentComplaintTemplate.create({
        data: {
          departmentId,
          name: input.name,
          description: input.description ?? null,
          isActive: input.isActive ?? true,
          schema: input.schema as any,
        },
      });
      
      await this.auditService.record({
        eventType: 'CONFIG',
        action: 'complaint_template_created',
        actorId,
        branchId: null,
        targetType: 'department_complaint_template',
        targetId: template.id,
        correlationId: null,
        ipAddress: null,
        userAgent: null,
        metadata: { departmentId, name: template.name }
      }, client);

      return template;
    });
  }

  async update(id: string, actorId: string | null, input: UpdateComplaintTemplateDto): Promise<ComplaintTemplateResponseDto> {
    return this.complaintsRepository.transaction(async (client) => {
      const existing = await client.departmentComplaintTemplate.findUnique({ where: { id } });
      if (!existing) {
        throw new AppException('NOT_FOUND', 'Template not found', HttpStatus.NOT_FOUND);
      }

      const template = await client.departmentComplaintTemplate.update({
        where: { id },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.description !== undefined ? { description: input.description ?? null } : {}),
          ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
          ...(input.schema !== undefined ? { schema: input.schema as any } : {}),
        },
      });

      await this.auditService.record({
        eventType: 'CONFIG',
        action: 'complaint_template_updated',
        actorId,
        branchId: null,
        targetType: 'department_complaint_template',
        targetId: template.id,
        correlationId: null,
        ipAddress: null,
        userAgent: null,
        metadata: { departmentId: template.departmentId, name: template.name }
      }, client);

      return template;
    });
  }

  async delete(id: string, actorId: string | null): Promise<{ ok: true }> {
    return this.complaintsRepository.transaction(async (client) => {
      const existing = await client.departmentComplaintTemplate.findUnique({ where: { id } });
      if (!existing) {
        throw new AppException('NOT_FOUND', 'Template not found', HttpStatus.NOT_FOUND);
      }

      await client.departmentComplaintTemplate.delete({ where: { id } });

      await this.auditService.record({
        eventType: 'CONFIG',
        action: 'complaint_template_deleted',
        actorId,
        branchId: null,
        targetType: 'department_complaint_template',
        targetId: id,
        correlationId: null,
        ipAddress: null,
        userAgent: null,
        metadata: { departmentId: existing.departmentId, name: existing.name }
      }, client);

      return { ok: true };
    });
  }

  async getDetail(id: string): Promise<ComplaintTemplateResponseDto> {
    return this.complaintsRepository.transaction(async (client) => {
      const existing = await client.departmentComplaintTemplate.findUnique({ where: { id } });
      if (!existing) {
        throw new AppException('NOT_FOUND', 'Template not found', HttpStatus.NOT_FOUND);
      }
      return existing;
    });
  }
}

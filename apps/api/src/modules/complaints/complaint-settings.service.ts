import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/http-kernel.js';

export type RootCauseInput = {
  nameEn: string;
  nameAr?: string | undefined;
  order?: number | undefined;
  isActive?: boolean | undefined;
};

export type SalesAdvisorInput = {
  nameEn: string;
  nameAr?: string | undefined;
  order?: number | undefined;
  isActive?: boolean | undefined;
};

@Injectable()
export class ComplaintSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async listRootCauses() {
    try {
      return await this.prisma.complaintRootCause.findMany({
        orderBy: [{ order: 'asc' }, { nameEn: 'asc' }],
      });
    } catch {
      return [];
    }
  }

  async createRootCause(input: RootCauseInput) {
    const nameEn = input.nameEn?.trim();
    if (!nameEn) {
      throw new BadRequestException('English name is required');
    }
    const nameAr = (input.nameAr?.trim() || nameEn);
    return this.prisma.complaintRootCause.create({
      data: {
        nameEn,
        nameAr,
        order: input.order ?? 0,
        isActive: input.isActive ?? true,
      },
    });
  }

  async updateRootCause(id: string, input: Partial<RootCauseInput>) {
    return this.prisma.complaintRootCause.update({
      where: { id },
      data: {
        ...(input.nameEn !== undefined ? { nameEn: input.nameEn.trim() } : {}),
        ...(input.nameAr !== undefined ? { nameAr: input.nameAr.trim() } : {}),
        ...(input.order !== undefined ? { order: input.order } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
    });
  }

  async deleteRootCause(id: string) {
    return this.prisma.complaintRootCause.delete({
      where: { id },
    });
  }

  async listSalesAdvisors() {
    try {
      return await this.prisma.complaintSalesAdvisor.findMany({
        orderBy: [{ order: 'asc' }, { nameEn: 'asc' }],
      });
    } catch {
      return [];
    }
  }

  async createSalesAdvisor(input: SalesAdvisorInput) {
    const nameEn = input.nameEn?.trim();
    if (!nameEn) {
      throw new BadRequestException('English name is required');
    }
    const nameAr = (input.nameAr?.trim() || nameEn);
    return this.prisma.complaintSalesAdvisor.create({
      data: {
        nameEn,
        nameAr,
        order: input.order ?? 0,
        isActive: input.isActive ?? true,
      },
    });
  }

  async updateSalesAdvisor(id: string, input: Partial<SalesAdvisorInput>) {
    return this.prisma.complaintSalesAdvisor.update({
      where: { id },
      data: {
        ...(input.nameEn !== undefined ? { nameEn: input.nameEn.trim() } : {}),
        ...(input.nameAr !== undefined ? { nameAr: input.nameAr.trim() } : {}),
        ...(input.order !== undefined ? { order: input.order } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
    });
  }

  async deleteSalesAdvisor(id: string) {
    return this.prisma.complaintSalesAdvisor.delete({
      where: { id },
    });
  }
}


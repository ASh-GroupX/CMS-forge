import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/http-kernel.js';

const categorySelect = {
  id: true,
  code: true,
  nameEn: true,
  nameAr: true,
  departmentId: true,
  branchId: true,
  isActive: true,
  isExternal: true,
  isInternal: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CategorySelect;

export type AdminCategoryRecord = Prisma.CategoryGetPayload<{ select: typeof categorySelect }>;
type CategoryClient = Pick<Prisma.TransactionClient, 'category'>;
export type AdminCategoryData = { code: string; nameEn: string; nameAr: string; departmentId?: string | null; branchId?: string | null; isExternal?: boolean; isInternal?: boolean };

@Injectable()
export class AdminCategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async transaction<T>(work: (client: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(work);
  }

  async departmentExists(id: string): Promise<boolean> {
    return Boolean(await this.prisma.department.findUnique({ where: { id }, select: { id: true } }));
  }

  async branchExists(id: string): Promise<boolean> {
    return Boolean(await this.prisma.branch.findUnique({ where: { id }, select: { id: true } }));
  }

  async list(): Promise<AdminCategoryRecord[]> {
    return this.prisma.category.findMany({
      orderBy: [{ isActive: 'desc' }, { nameEn: 'asc' }, { code: 'asc' }],
      select: categorySelect,
    });
  }

  async create(data: AdminCategoryData, client: CategoryClient = this.prisma): Promise<AdminCategoryRecord> {
    return client.category.create({ data, select: categorySelect });
  }

  async update(id: string, data: AdminCategoryData, client: CategoryClient = this.prisma): Promise<AdminCategoryRecord> {
    return client.category.update({ where: { id }, data, select: categorySelect });
  }

  async deactivate(id: string, client: CategoryClient = this.prisma): Promise<AdminCategoryRecord> {
    return client.category.update({ where: { id }, data: { isActive: false }, select: categorySelect });
  }
}

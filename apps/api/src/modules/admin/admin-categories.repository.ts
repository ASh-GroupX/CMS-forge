import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/http-kernel.js';

const categorySelect = {
  id: true,
  code: true,
  nameEn: true,
  nameAr: true,
  parentId: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CategorySelect;

export type AdminCategoryRecord = Prisma.CategoryGetPayload<{ select: typeof categorySelect }>;
type CategoryClient = Pick<Prisma.TransactionClient, 'category'>;
export type AdminCategoryData = { code: string; nameEn: string; nameAr: string; parentId?: string | null };

@Injectable()
export class AdminCategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async transaction<T>(work: (client: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(work);
  }

  async parentExists(id: string): Promise<boolean> {
    return Boolean(await this.prisma.category.findUnique({ where: { id }, select: { id: true } }));
  }

  async create(data: AdminCategoryData, client: CategoryClient = this.prisma): Promise<AdminCategoryRecord> {
    return client.category.create({ data, select: categorySelect });
  }

  async update(id: string, data: AdminCategoryData, client: CategoryClient = this.prisma): Promise<AdminCategoryRecord> {
    return client.category.update({ where: { id }, data, select: categorySelect });
  }
}

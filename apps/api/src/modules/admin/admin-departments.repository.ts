import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/http-kernel.js';

const departmentSelect = {
  id: true,
  code: true,
  nameEn: true,
  nameAr: true,
  branchId: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.DepartmentSelect;

export type AdminDepartmentRecord = Prisma.DepartmentGetPayload<{ select: typeof departmentSelect }>;
type DepartmentClient = Pick<Prisma.TransactionClient, 'department'>;
export type AdminDepartmentData = { code: string; nameEn: string; nameAr: string; branchId: string | null };

@Injectable()
export class AdminDepartmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  transaction<T>(work: (client: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(work);
  }

  create(data: AdminDepartmentData, client: DepartmentClient = this.prisma): Promise<AdminDepartmentRecord> {
    return client.department.create({ data: { ...data, isActive: true }, select: departmentSelect });
  }
}

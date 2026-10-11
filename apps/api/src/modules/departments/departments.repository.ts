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

export type DepartmentRecord = Prisma.DepartmentGetPayload<{ select: typeof departmentSelect }>;
type DepartmentClient = Pick<Prisma.TransactionClient, 'department' | 'standardProblem'>;

export const standardProblemSelect = {
  id: true,
  departmentId: true,
  categoryId: true,
  titleEn: true,
  titleAr: true,
  isActive: true,
} satisfies Prisma.StandardProblemSelect;

export type StandardProblemRecord = Prisma.StandardProblemGetPayload<{ select: typeof standardProblemSelect }>;

export type CreateDepartmentData = {
  code: string;
  nameEn: string;
  nameAr: string;
  branchId: string | null;
};

export type UpdateDepartmentData = Partial<CreateDepartmentData>;

@Injectable()
export class DepartmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async transaction<T>(work: (client: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(work);
  }

  async listActive(): Promise<DepartmentRecord[]> {
    return this.prisma.department.findMany({
      where: { isActive: true },
      orderBy: [{ nameEn: 'asc' }, { code: 'asc' }],
      select: departmentSelect,
    });
  }

  async findByIdOrCode(idOrCode: string): Promise<DepartmentRecord | null> {
    return this.prisma.department.findFirst({
      where: {
        OR: [{ id: idOrCode }, { code: idOrCode }],
      },
      select: departmentSelect,
    });
  }

  async create(data: CreateDepartmentData, client: DepartmentClient = this.prisma): Promise<DepartmentRecord> {
    return client.department.create({
      data,
      select: departmentSelect,
    });
  }

  async update(id: string, data: UpdateDepartmentData, client: DepartmentClient = this.prisma): Promise<DepartmentRecord> {
    return client.department.update({
      where: { id },
      data,
      select: departmentSelect,
    });
  }

  async deactivate(id: string, client: DepartmentClient = this.prisma): Promise<DepartmentRecord> {
    return client.department.update({
      where: { id },
      data: { isActive: false },
      select: departmentSelect,
    });
  }

  async delete(id: string, client: DepartmentClient = this.prisma): Promise<DepartmentRecord> {
    return client.department.delete({
      where: { id },
      select: departmentSelect,
    });
  }

  async findStandardProblems(departmentId: string): Promise<StandardProblemRecord[]> {
    return this.prisma.standardProblem.findMany({
      where: { departmentId },
      orderBy: { titleEn: 'asc' },
      select: standardProblemSelect,
    });
  }

  async createStandardProblem(departmentId: string, data: { titleEn: string; titleAr: string; categoryId: string }, client: DepartmentClient = this.prisma): Promise<StandardProblemRecord> {
    return client.standardProblem.create({
      data: { ...data, departmentId },
      select: standardProblemSelect,
    });
  }

  async updateStandardProblem(id: string, data: { titleEn?: string; titleAr?: string; isActive?: boolean }, client: DepartmentClient = this.prisma): Promise<StandardProblemRecord> {
    return client.standardProblem.update({
      where: { id },
      data,
      select: standardProblemSelect,
    });
  }

  async deleteStandardProblem(id: string, client: DepartmentClient = this.prisma): Promise<StandardProblemRecord> {
    return client.standardProblem.delete({
      where: { id },
      select: standardProblemSelect,
    });
  }
}

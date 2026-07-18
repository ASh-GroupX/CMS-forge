import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/http-kernel.js';

const assignmentSelect = {
  id: true,
  entityType: true,
  entityId: true,
  assignedUserId: true,
  assignedDepartmentId: true,
  scopeBranchId: true,
  assignedById: true,
  version: true,
  createdAt: true,
  updatedAt: true,
  assignedUser: { select: { nameEn: true, nameAr: true } },
  assignedDepartment: { select: { nameEn: true, nameAr: true } },
} satisfies Prisma.AssignmentSelect;

const userOptionSelect = {
  id: true,
  nameEn: true,
  nameAr: true,
  branchId: true,
  departmentId: true,
  role: { select: { code: true } },
} satisfies Prisma.UserSelect;

const departmentOptionSelect = {
  id: true,
  nameEn: true,
  nameAr: true,
  branchId: true,
} satisfies Prisma.DepartmentSelect;

const assignmentRecipientSelect = {
  id: true,
  email: true,
  nameEn: true,
  nameAr: true,
} satisfies Prisma.UserSelect;

export type AssignmentRecord = Prisma.AssignmentGetPayload<{ select: typeof assignmentSelect }>;
export type AssignmentUserOption = Prisma.UserGetPayload<{ select: typeof userOptionSelect }>;
export type AssignmentDepartmentOption = Prisma.DepartmentGetPayload<{ select: typeof departmentOptionSelect }>;
export type AssignmentRecipient = Prisma.UserGetPayload<{ select: typeof assignmentRecipientSelect }>;
export type AssignmentClient = Pick<Prisma.TransactionClient, 'assignment' | 'assignmentHistory' | 'user' | 'department'>;

export type AssignmentWriteData = {
  entityType: string;
  entityId: string;
  assignedUserId: string | null;
  assignedDepartmentId: string | null;
  scopeBranchId: string | null;
  assignedById: string;
  action: string;
  reason: string | null;
  correlationId: string | null;
};

@Injectable()
export class AssignmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  transaction<T>(work: (client: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(work);
  }

  findCurrent(entityType: string, entityId: string, client: AssignmentClient = this.prisma): Promise<AssignmentRecord | null> {
    return client.assignment.findUnique({ where: { entityType_entityId: { entityType, entityId } }, select: assignmentSelect });
  }

  findActiveUser(id: string, client: AssignmentClient = this.prisma) {
    return client.user.findFirst({
      where: { id, isActive: true, lockedAt: null, role: { code: { not: 'CUSTOMER_PORTAL' } } },
      select: { id: true, branchId: true, departmentId: true },
    });
  }

  findActiveDepartment(id: string, client: AssignmentClient = this.prisma) {
    return client.department.findFirst({ where: { id, isActive: true }, select: { id: true, branchId: true } });
  }

  async write(data: AssignmentWriteData, client: AssignmentClient): Promise<AssignmentRecord> {
    const assignment = await client.assignment.upsert({
      where: { entityType_entityId: { entityType: data.entityType, entityId: data.entityId } },
      create: {
        entityType: data.entityType,
        entityId: data.entityId,
        assignedUserId: data.assignedUserId,
        assignedDepartmentId: data.assignedDepartmentId,
        scopeBranchId: data.scopeBranchId,
        assignedById: data.assignedById,
      },
      update: {
        assignedUserId: data.assignedUserId,
        assignedDepartmentId: data.assignedDepartmentId,
        scopeBranchId: data.scopeBranchId,
        assignedById: data.assignedById,
        version: { increment: 1 },
      },
      select: assignmentSelect,
    });
    await client.assignmentHistory.create({
      data: {
        assignmentId: assignment.id,
        entityType: data.entityType,
        entityId: data.entityId,
        action: data.action,
        assignedUserId: data.assignedUserId,
        assignedDepartmentId: data.assignedDepartmentId,
        assignedById: data.assignedById,
        reason: data.reason,
        correlationId: data.correlationId,
      },
    });
    return assignment;
  }

  async options(branchId: string | null): Promise<{ users: AssignmentUserOption[]; departments: AssignmentDepartmentOption[] }> {
    const [users, departments] = await Promise.all([
      this.prisma.user.findMany({
        where: { isActive: true, lockedAt: null, role: { code: { not: 'CUSTOMER_PORTAL' } }, ...(branchId ? { branchId } : {}) },
        orderBy: [{ nameEn: 'asc' }, { email: 'asc' }],
        select: userOptionSelect,
      }),
      this.prisma.department.findMany({
        where: { isActive: true, ...(branchId ? { OR: [{ branchId }, { branchId: null }] } : {}) },
        orderBy: [{ nameEn: 'asc' }, { code: 'asc' }],
        select: departmentOptionSelect,
      }),
    ]);
    return { users, departments };
  }

  recipientUsers(assignedUserId: string | null, assignedDepartmentId: string | null): Promise<AssignmentRecipient[]> {
    const targets = [
      ...(assignedUserId ? [{ id: assignedUserId }] : []),
      ...(assignedDepartmentId ? [{ departmentId: assignedDepartmentId }] : []),
    ];
    if (targets.length === 0) return Promise.resolve([]);
    return this.prisma.user.findMany({
      where: {
        isActive: true,
        lockedAt: null,
        role: { code: { not: 'CUSTOMER_PORTAL' } },
        OR: targets,
      },
      orderBy: [{ nameEn: 'asc' }, { email: 'asc' }],
      select: assignmentRecipientSelect,
    });
  }
}

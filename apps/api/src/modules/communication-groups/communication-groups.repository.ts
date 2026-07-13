import { Injectable } from '@nestjs/common';
import { RoleCode, type Prisma } from '@prisma/client';
import { PrismaService } from '../../core/http-kernel.js';

const staffSelect = {
  id: true,
  email: true,
  nameEn: true,
  nameAr: true,
  branchId: true,
  departmentId: true,
  role: { select: { id: true, code: true, nameEn: true, nameAr: true } },
  department: { select: { id: true, nameEn: true, nameAr: true } },
  branch: { select: { id: true, nameEn: true, nameAr: true } },
} satisfies Prisma.UserSelect;

const groupSelect = {
  id: true,
  name: true,
  visibility: true,
  ownerId: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  members: { select: { user: { select: staffSelect } }, orderBy: { user: { nameEn: 'asc' } } },
} satisfies Prisma.CommunicationGroupSelect;

export type CommunicationStaffRecord = Prisma.UserGetPayload<{ select: typeof staffSelect }>;
export type CommunicationGroupRecord = Prisma.CommunicationGroupGetPayload<{ select: typeof groupSelect }>;
type GroupClient = Pick<Prisma.TransactionClient, 'communicationGroup' | 'communicationGroupMember'>;

@Injectable()
export class CommunicationGroupsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async transaction<T>(work: (client: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(work);
  }

  async listVisible(actorId: string): Promise<CommunicationGroupRecord[]> {
    return this.prisma.communicationGroup.findMany({
      where: { isActive: true, OR: [{ ownerId: actorId }, { visibility: 'SHARED' }] },
      orderBy: [{ visibility: 'asc' }, { name: 'asc' }],
      select: groupSelect,
    });
  }

  async find(id: string, client: GroupClient = this.prisma): Promise<CommunicationGroupRecord | null> {
    return client.communicationGroup.findUnique({ where: { id }, select: groupSelect });
  }

  async create(data: { name: string; ownerId: string; visibility: 'PERSONAL' | 'SHARED'; memberUserIds: string[] }, client: GroupClient): Promise<CommunicationGroupRecord> {
    return client.communicationGroup.create({
      data: { name: data.name, ownerId: data.ownerId, visibility: data.visibility, members: { create: data.memberUserIds.map((userId) => ({ userId })) } },
      select: groupSelect,
    });
  }

  async replace(id: string, data: { name: string; memberUserIds: string[] }, client: GroupClient): Promise<CommunicationGroupRecord> {
    return client.communicationGroup.update({
      where: { id },
      data: { name: data.name, members: { deleteMany: {}, create: data.memberUserIds.map((userId) => ({ userId })) } },
      select: groupSelect,
    });
  }

  async deactivate(id: string, client: GroupClient): Promise<CommunicationGroupRecord> {
    return client.communicationGroup.update({ where: { id }, data: { isActive: false }, select: groupSelect });
  }

  async listStaffForBranch(branchId: string | null): Promise<CommunicationStaffRecord[]> {
    return this.prisma.user.findMany({
      where: {
        isActive: true,
        lockedAt: null,
        role: { code: { not: RoleCode.CUSTOMER_PORTAL } },
        ...(branchId ? { OR: [{ branchId }, { role: { code: RoleCode.ADMIN } }] } : {}),
      },
      orderBy: [{ nameEn: 'asc' }, { email: 'asc' }],
      select: staffSelect,
    });
  }
}

import { Injectable } from '@nestjs/common';
import type { ComplaintSeverity, ComplaintStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../core/http-kernel.js';

type RelationClient = Pick<Prisma.TransactionClient, 'complaint' | 'complaintRelation'>;

export type ComplaintRelationFilter = { branchId?: string | null };
export type ComplaintRelationAnchor = ComplaintRelationItemRecord & { categoryId: string; customerId: string };
export type ComplaintRelationKey = { sourceComplaintId: string; targetComplaintId: string };

export type ComplaintRelationItemRecord = {
  id: string;
  referenceNumber: string;
  branchId: string;
  status: ComplaintStatus;
  severity: ComplaintSeverity;
  subject: string;
  ownerId: string | null;
  owner: { nameEn: string; email: string } | null;
  customer: { nameEn: string };
  branch: { code: string; nameEn: string; nameAr: string };
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class ComplaintRelationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async transaction<T>(work: (client: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(work);
  }

  async findAnchor(id: string, filter: ComplaintRelationFilter = {}, client: RelationClient = this.prisma): Promise<ComplaintRelationAnchor | null> {
    return client.complaint.findFirst({ where: scoped({ id }, filter), select: { ...itemSelect, categoryId: true, customerId: true } });
  }

  async listRelated(complaintId: string, filter: ComplaintRelationFilter = {}, client: RelationClient = this.prisma): Promise<ComplaintRelationItemRecord[]> {
    const relations = await client.complaintRelation.findMany({
      where: { OR: [{ sourceComplaintId: complaintId }, { targetComplaintId: complaintId }] },
      select: { sourceComplaintId: true, targetComplaintId: true },
    });
    const ids = relations.map((relation) => relation.sourceComplaintId === complaintId ? relation.targetComplaintId : relation.sourceComplaintId);
    return ids.length ? client.complaint.findMany({ where: scoped({ id: { in: ids } }, filter), orderBy: [{ createdAt: 'desc' }, { referenceNumber: 'asc' }], select: itemSelect }) : [];
  }

  async createRelation(key: ComplaintRelationKey, client: RelationClient = this.prisma): Promise<boolean> {
    const result = await client.complaintRelation.createMany({ data: [normalizeKey(key)], skipDuplicates: true });
    return result.count > 0;
  }

  async deleteRelation(key: ComplaintRelationKey, client: RelationClient = this.prisma): Promise<boolean> {
    const result = await client.complaintRelation.deleteMany({ where: normalizeKey(key) });
    return result.count > 0;
  }

  async findDuplicateCandidates(source: ComplaintRelationAnchor, windowDays: number, client: RelationClient = this.prisma): Promise<ComplaintRelationItemRecord[]> {
    const createdAt = { gte: daysFrom(source.createdAt, -windowDays), lte: daysFrom(source.createdAt, windowDays) };
    return client.complaint.findMany({
      where: { id: { not: source.id }, customerId: source.customerId, categoryId: source.categoryId, branchId: source.branchId, createdAt },
      orderBy: [{ createdAt: 'desc' }, { referenceNumber: 'asc' }],
      take: 10,
      select: itemSelect,
    });
  }
}

const itemSelect = {
  id: true, referenceNumber: true, branchId: true, status: true, severity: true, subject: true,
  ownerId: true, owner: { select: { nameEn: true, email: true } }, customer: { select: { nameEn: true } }, branch: { select: { code: true, nameEn: true, nameAr: true } },
  createdAt: true, updatedAt: true,
} satisfies Prisma.ComplaintSelect;

function scoped(where: Prisma.ComplaintWhereInput, filter: ComplaintRelationFilter): Prisma.ComplaintWhereInput {
  return { ...where, ...(filter.branchId ? { branchId: filter.branchId } : {}) };
}

function normalizeKey(key: ComplaintRelationKey): ComplaintRelationKey {
  return key.sourceComplaintId < key.targetComplaintId ? key : { sourceComplaintId: key.targetComplaintId, targetComplaintId: key.sourceComplaintId };
}

function daysFrom(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

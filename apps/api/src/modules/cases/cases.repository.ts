import { Injectable } from '@nestjs/common';
import type { CaseLinkEntityType, CaseType, ComplaintStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../core/http-kernel.js';

const caseSelect = {
  id: true,
  type: true,
  status: true,
  branchId: true,
  ownerId: true,
  subject: true,
  descriptionEn: true,
  descriptionAr: true,
  createdAt: true,
  updatedAt: true,
  links: { select: { entityType: true, entityId: true, createdAt: true } },
} satisfies Prisma.CaseSelect;

export type CaseRecord = Prisma.CaseGetPayload<{ select: typeof caseSelect }>;
type CaseClient = Pick<Prisma.TransactionClient, 'case'>;

export type CreateCaseData = {
  type: CaseType;
  status: ComplaintStatus;
  branchId: string;
  ownerId?: string | null;
  subject: string;
  descriptionEn: string;
  descriptionAr?: string | null;
  links: { entityType: CaseLinkEntityType; entityId: string }[];
};

@Injectable()
export class CasesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateCaseData, client: CaseClient = this.prisma): Promise<CaseRecord> {
    return client.case.create({
      data: {
        type: data.type,
        status: data.status,
        subject: data.subject,
        descriptionEn: data.descriptionEn,
        descriptionAr: data.descriptionAr ?? null,
        branch: { connect: { id: data.branchId } },
        ...(data.ownerId ? { owner: { connect: { id: data.ownerId } } } : {}),
        links: { create: data.links },
      },
      select: caseSelect,
    });
  }

  async findById(id: string): Promise<CaseRecord | null> {
    return this.prisma.case.findUnique({ where: { id }, select: caseSelect });
  }
}

import { Injectable } from '@nestjs/common';
import { CaseLinkEntityType } from '@prisma/client';
import type { CaseType, ComplaintStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../core/http-kernel.js';

const capaSelect = {
  id: true,
  caseId: true,
  rootCause: true,
  responsibleDepartmentId: true,
  correctiveAction: true,
  preventiveAction: true,
  dueAt: true,
  effectivenessCheck: true,
  repeatFlag: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CapaActionSelect;

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
  capaActions: { select: capaSelect, orderBy: [{ dueAt: 'asc' }, { createdAt: 'asc' }] },
} satisfies Prisma.CaseSelect;

export type CaseRecord = Prisma.CaseGetPayload<{ select: typeof caseSelect }>;
type CaseClient = Pick<Prisma.TransactionClient, 'case'>;
export type CapaActionRecord = Prisma.CapaActionGetPayload<{ select: typeof capaSelect }>;
type CapaClient = Pick<Prisma.TransactionClient, 'capaAction'>;

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

export type CreateCapaActionData = {
  caseId: string;
  rootCause: string;
  responsibleDepartmentId: string;
  correctiveAction: string;
  preventiveAction: string;
  dueAt: Date;
  effectivenessCheck?: string | null;
  repeatFlag?: boolean;
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

  async createCapaAction(data: CreateCapaActionData, client: CapaClient = this.prisma): Promise<CapaActionRecord> {
    return client.capaAction.create({
      data: {
        rootCause: data.rootCause,
        correctiveAction: data.correctiveAction,
        preventiveAction: data.preventiveAction,
        dueAt: data.dueAt,
        effectivenessCheck: data.effectivenessCheck ?? null,
        repeatFlag: data.repeatFlag ?? false,
        case: { connect: { id: data.caseId } },
        responsibleDepartment: { connect: { id: data.responsibleDepartmentId } },
      },
      select: capaSelect,
    });
  }

  async listCapaActions(caseId: string): Promise<CapaActionRecord[]> {
    return this.prisma.capaAction.findMany({
      where: { caseId },
      orderBy: [{ dueAt: 'asc' }, { createdAt: 'asc' }],
      select: capaSelect,
    });
  }

  async countRepeatCustomerRootCause(input: { caseId: string; customerIds: string[]; rootCauses: string[] }): Promise<number> {
    if (!input.customerIds.length || !input.rootCauses.length) return 0;
    return this.prisma.capaAction.count({
      where: {
        caseId: { not: input.caseId },
        rootCause: { in: input.rootCauses },
        case: { links: { some: { entityType: CaseLinkEntityType.CUSTOMER, entityId: { in: input.customerIds } } } },
      },
    });
  }
}

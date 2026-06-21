import { Injectable } from '@nestjs/common';
import { CaseLinkEntityType } from '@prisma/client';
import type { CapaActionStatus, CaseConfidentialityLevel, CaseLifecycleStatus, CaseParticipantRole, CaseType, ComplaintStatus, ComplaintTransitionAction, Prisma } from '@prisma/client';
import { PrismaService } from '../../core/http-kernel.js';

const capaSelect = {
  id: true,
  caseId: true,
  rootCause: true,
  ownerId: true,
  owner: { select: { nameEn: true } },
  responsibleDepartmentId: true,
  correctiveAction: true,
  preventiveAction: true,
  dueAt: true,
  status: true,
  effectivenessCheck: true,
  repeatFlag: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CapaActionSelect;

const caseSelect = {
  id: true,
  type: true,
  status: true,
  lifecycleStatus: true,
  confidentialityLevel: true,
  branchId: true,
  ownerId: true,
  subject: true,
  descriptionEn: true,
  descriptionAr: true,
  createdAt: true,
  updatedAt: true,
  branch: { select: { nameEn: true, nameAr: true } },
  owner: { select: { nameEn: true } },
  links: { select: { entityType: true, entityId: true, createdAt: true } },
  participants: { select: { userId: true, role: true } },
  restrictedNotes: { select: { id: true, authorId: true, body: true, createdAt: true }, orderBy: { createdAt: 'asc' } },
  lifecycleHistory: { select: { id: true, fromStatus: true, toStatus: true, actorId: true, createdAt: true }, orderBy: { createdAt: 'asc' } },
  capaActions: { select: capaSelect, orderBy: [{ dueAt: 'asc' }, { createdAt: 'asc' }] },
} satisfies Prisma.CaseSelect;

export type CaseRecord = Prisma.CaseGetPayload<{ select: typeof caseSelect }>;
type CaseClient = Pick<Prisma.TransactionClient, 'case' | 'caseLifecycleHistory' | 'caseLink' | 'complaintStatusHistory'>;
export type CapaActionRecord = Prisma.CapaActionGetPayload<{ select: typeof capaSelect }>;
type CapaClient = Pick<Prisma.TransactionClient, 'capaAction'>;
export type ComplaintLifecycleRecord = {
  complaintId: string;
  fromStatus: ComplaintStatus | null;
  toStatus: ComplaintStatus;
  action: ComplaintTransitionAction | null;
  createdAt: Date;
};

export type CreateCaseData = {
  type: CaseType;
  status: ComplaintStatus;
  lifecycleStatus: CaseLifecycleStatus;
  confidentialityLevel: CaseConfidentialityLevel;
  branchId: string;
  ownerId?: string | null;
  subject: string;
  descriptionEn: string;
  descriptionAr?: string | null;
  links: { entityType: CaseLinkEntityType; entityId: string }[];
  participants: { userId: string; role: CaseParticipantRole }[];
};

export type UpdateCaseLifecycleData = {
  id: string;
  fromStatus: CaseLifecycleStatus;
  toStatus: CaseLifecycleStatus;
  actorId?: string | null;
  correlationId?: string | null;
};

export type CreateCapaActionData = {
  caseId: string;
  ownerId: string;
  rootCause: string;
  responsibleDepartmentId?: string | null;
  correctiveAction: string;
  preventiveAction: string;
  dueAt: Date;
  status: CapaActionStatus;
  effectivenessCheck?: string | null;
  repeatFlag?: boolean;
};

@Injectable()
export class CasesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async transaction<T>(work: (client: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(work);
  }

  async create(data: CreateCaseData, client: CaseClient = this.prisma): Promise<CaseRecord> {
    const createData: Prisma.CaseCreateInput = {
      type: data.type,
      status: data.status,
      lifecycleStatus: data.lifecycleStatus,
      subject: data.subject,
      descriptionEn: data.descriptionEn,
      descriptionAr: data.descriptionAr ?? null,
      confidentialityLevel: data.confidentialityLevel,
      branch: { connect: { id: data.branchId } },
      links: { create: data.links },
    };
    if (data.ownerId) createData.owner = { connect: { id: data.ownerId } };
    if (data.participants.length) createData.participants = { create: data.participants };

    return client.case.create({
      data: createData,
      select: caseSelect,
    });
  }

  async findById(id: string): Promise<CaseRecord | null> {
    return this.prisma.case.findUnique({ where: { id }, select: caseSelect });
  }

  async findByIdInTransaction(id: string, client: CaseClient): Promise<CaseRecord | null> {
    return client.case.findUnique({ where: { id }, select: caseSelect });
  }

  async findCustomerComplaintByComplaintId(complaintId: string, client: CaseClient = this.prisma): Promise<CaseRecord | null> {
    return client.case.findFirst({
      where: { type: 'CUSTOMER_COMPLAINT', links: { some: { entityType: CaseLinkEntityType.COMPLAINT, entityId: complaintId } } },
      select: caseSelect,
    });
  }

  async createInitialLifecycleHistory(data: { caseId: string; toStatus: CaseLifecycleStatus; actorId?: string | null; correlationId?: string | null }, client: CaseClient): Promise<void> {
    await client.caseLifecycleHistory.create({ data: { caseId: data.caseId, fromStatus: null, toStatus: data.toStatus, actorId: data.actorId ?? null, correlationId: data.correlationId ?? null } });
  }

  async listComplaintLifecycle(complaintIds: string[], client: CaseClient = this.prisma): Promise<ComplaintLifecycleRecord[]> {
    if (!complaintIds.length) return [];
    return client.complaintStatusHistory.findMany({
      where: { complaintId: { in: complaintIds } },
      orderBy: { createdAt: 'asc' },
      select: { complaintId: true, fromStatus: true, toStatus: true, action: true, createdAt: true },
    });
  }

  async updateLifecycleStatus(data: UpdateCaseLifecycleData, client: CaseClient): Promise<CaseRecord> {
    const updated = await client.case.update({
      where: { id: data.id },
      data: { lifecycleStatus: data.toStatus },
      select: caseSelect,
    });
    await client.caseLifecycleHistory.create({
      data: {
        caseId: data.id,
        fromStatus: data.fromStatus,
        toStatus: data.toStatus,
        actorId: data.actorId ?? null,
        correlationId: data.correlationId ?? null,
      },
    });
    return updated;
  }

  async createCapaAction(data: CreateCapaActionData, client: CapaClient = this.prisma): Promise<CapaActionRecord> {
    return client.capaAction.create({
      data: {
        rootCause: data.rootCause,
        owner: { connect: { id: data.ownerId } },
        correctiveAction: data.correctiveAction,
        preventiveAction: data.preventiveAction,
        dueAt: data.dueAt,
        status: data.status,
        effectivenessCheck: data.effectivenessCheck ?? null,
        repeatFlag: data.repeatFlag ?? false,
        case: { connect: { id: data.caseId } },
        ...(data.responsibleDepartmentId ? { responsibleDepartment: { connect: { id: data.responsibleDepartmentId } } } : {}),
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

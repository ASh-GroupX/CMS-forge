import { Injectable } from '@nestjs/common';
import type { CommentVisibility, ComplaintSeverity, ComplaintStatus, ComplaintTransitionAction, ComplaintTransitionRequestSource, Prisma, RoleCode } from '@prisma/client';
import { PrismaService } from '../../core/http-kernel.js';
import { nextReferenceNumber, upsertVehicle } from './complaint-reference.repository.js';
import type { ComplaintReferenceClient } from './complaint-reference.repository.js';

type ComplaintTransitionClient = Pick<Prisma.TransactionClient, 'comment' | 'complaint' | 'complaintStatusHistory' | 'customer'> & ComplaintReferenceClient;

export type ComplaintStatusRecord = { id: string; branchId: string; status: ComplaintStatus; ownerId: string | null; severity: ComplaintSeverity; categoryId: string; departmentId: string | null };
export type ComplaintRecord = { id: string; branchId: string; status: ComplaintStatus; referenceNumber: string; subject: string; severity: ComplaintSeverity };

export type ComplaintQueueRecord = ComplaintRecord & {
  ownerId: string | null;
  owner: { nameEn: string; email: string } | null; branch: { code: string; nameEn: string; nameAr: string };
  createdAt: Date;
  updatedAt: Date;
};

export type ComplaintDetailRecord = ComplaintQueueRecord & {
  descriptionEn: string;
  incidentAt: Date | null;
  statusHistory: Array<{
    id: string;
    fromStatus: ComplaintStatus | null;
    toStatus: ComplaintStatus;
    action: ComplaintTransitionAction | null;
    actorId: string | null;
    actorRole: RoleCode | null;
    requestSource: ComplaintTransitionRequestSource | null;
    reason: string | null;
    correlationId: string | null;
    createdAt: Date;
  }>;
};

export type CreateComplaintData = {
  referenceNumber: string;
  status: ComplaintStatus;
  subject: string;
  severity: ComplaintSeverity;
  branchId: string;
  categoryId: string;
  customerName: string;
  customerPhone?: string | null;
  customerNumber?: string | null;
  vehicleId?: string | null;
  vehicleVin?: string | null;
  vehiclePlate?: string | null;
  vehicleBrand?: string | null;
  vehicleModel?: string | null;
  vehicleModelYear?: number | null;
  departmentId?: string | null;
  createdById?: string | null;
  descriptionEn: string;
  incidentAt: Date;
};

export type UpdateComplaintStatusData = { complaintId: string; fromStatus: ComplaintStatus; toStatus: ComplaintStatus; targetBranchId?: string | null; targetDepartmentId?: string | null; ownerId?: string | null; resolvedAt?: Date | null; closedAt?: Date | null };

export type CreateComplaintStatusHistoryData = {
  complaintId: string;
  fromStatus: ComplaintStatus | null;
  toStatus: ComplaintStatus;
  action: ComplaintTransitionAction | null;
  actorId?: string | null;
  actorRole: RoleCode | null;
  requestSource: ComplaintTransitionRequestSource;
  reason?: string | null;
  correlationId?: string | null;
};

export type ListComplaintQueueFilter = {
  branchId?: string | null;
};

export type ComplaintReportFilter = ListComplaintQueueFilter & {
  dateFrom?: Date | string | null;
  dateTo?: Date | string | null;
  referenceNumber?: string | null;
  customer?: string | null;
  status?: ComplaintStatus | null;
  categoryId?: string | null;
  departmentId?: string | null;
  severity?: ComplaintSeverity | null;
  ownerId?: string | null;
};

export type ComplaintReportRecord = ComplaintQueueRecord & {
  categoryId: string;
};

export type ComplaintSearchRecord = ComplaintReportRecord & {
  customerName: string;
  customerPhone: string;
  customerIdentifier: string | null;
};

export type ComplaintCommentRecord = { id: string; complaintId: string; authorId: string | null; body: string; visibility: CommentVisibility; createdAt: Date };
export type PortalVerificationTargetRecord = { complaintId: string; customerId: string; phone: string };
export type CreateComplaintCommentData = { complaintId: string; authorId?: string | null; body: string; visibility: CommentVisibility };

@Injectable()
export class ComplaintsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async transaction<T>(work: (client: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(work);
  }

  async nextReferenceNumber(branchId: string, at: Date, client: ComplaintTransitionClient = this.prisma): Promise<string> {
    return nextReferenceNumber(branchId, at, client);
  }

  async create(data: CreateComplaintData, client: ComplaintTransitionClient = this.prisma): Promise<ComplaintRecord> {
    const customer = await client.customer.upsert({
      where: { phone: customerPhone(data) },
      update: {},
      create: {
        phone: customerPhone(data),
        dmsCode: data.customerNumber ?? null,
        nameEn: data.customerName,
        nameAr: data.customerName,
      },
      select: { id: true },
    });

    const vehicleId = data.vehicleId ?? await upsertVehicle(data, customer.id, client);

    return client.complaint.create({
      data: {
        referenceNumber: data.referenceNumber,
        status: data.status,
        subject: data.subject,
        severity: data.severity,
        branchId: data.branchId,
        categoryId: data.categoryId,
        customerId: customer.id,
        vehicleId,
        departmentId: data.departmentId ?? null,
        createdById: data.createdById ?? null,
        descriptionEn: data.descriptionEn,
        incidentAt: data.incidentAt,
      },
      select: complaintSelect,
    });
  }

  async listQueue(filter: ListComplaintQueueFilter = {}, client: ComplaintTransitionClient = this.prisma): Promise<ComplaintQueueRecord[]> {
    return client.complaint.findMany({
      where: filter.branchId ? { branchId: filter.branchId } : {},
      orderBy: [{ createdAt: 'desc' }, { referenceNumber: 'asc' }],
      select: { ...complaintSelect, ownerId: true, owner: { select: { nameEn: true, email: true } }, branch: { select: { code: true, nameEn: true, nameAr: true } }, createdAt: true, updatedAt: true },
    });
  }

  async listForReports(filter: ComplaintReportFilter = {}, client: ComplaintTransitionClient = this.prisma): Promise<ComplaintSearchRecord[]> {
    return client.complaint.findMany({
      where: reportWhere(filter),
      orderBy: [{ createdAt: 'desc' }, { referenceNumber: 'asc' }],
      select: {
        ...complaintSelect,
        ownerId: true, owner: { select: { nameEn: true, email: true } }, branch: { select: { code: true, nameEn: true, nameAr: true } },
        categoryId: true,
        createdAt: true,
        updatedAt: true,
        customer: { select: { nameEn: true, phone: true, dmsCode: true } },
      },
    }).then((items) => items.map(({ customer, ...item }) => ({
      ...item,
      customerName: customer.nameEn,
      customerPhone: customer.phone,
      customerIdentifier: customer.dmsCode,
    })));
  }

  async search(filter: ComplaintReportFilter = {}, client: ComplaintTransitionClient = this.prisma): Promise<ComplaintSearchRecord[]> {
    return this.listForReports(filter, client);
  }

  async findDetail(id: string, filter: ListComplaintQueueFilter = {}, client: ComplaintTransitionClient = this.prisma): Promise<ComplaintDetailRecord | null> {
    return client.complaint.findFirst({
      where: { id, ...(filter.branchId ? { branchId: filter.branchId } : {}) },
      select: {
        ...complaintSelect,
        ownerId: true, owner: { select: { nameEn: true, email: true } }, branch: { select: { code: true, nameEn: true, nameAr: true } },
        descriptionEn: true,
        incidentAt: true,
        createdAt: true,
        updatedAt: true,
        statusHistory: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true, fromStatus: true, toStatus: true, action: true, actorId: true,
            actorRole: true, requestSource: true, reason: true, correlationId: true, createdAt: true,
          },
        },
      },
    });
  }

  async createComment(data: CreateComplaintCommentData, client: ComplaintTransitionClient = this.prisma): Promise<ComplaintCommentRecord> {
    return client.comment.create({ data, select: commentSelect });
  }

  async listPublicComments(complaintId: string, client: ComplaintTransitionClient = this.prisma): Promise<ComplaintCommentRecord[]> {
    return client.comment.findMany({
      where: { complaintId, visibility: 'PUBLIC' },
      orderBy: { createdAt: 'asc' },
      select: commentSelect,
    });
  }

  async findPortalVerificationTarget(referenceNumber: string, phone: string, client: ComplaintTransitionClient = this.prisma): Promise<PortalVerificationTargetRecord | null> {
    const complaint = await client.complaint.findFirst({
      where: { referenceNumber, customer: { phone } },
      select: { id: true, customerId: true, customer: { select: { phone: true } } },
    });
    return complaint ? { complaintId: complaint.id, customerId: complaint.customerId, phone: complaint.customer.phone } : null;
  }

  async updateStatus(
    data: UpdateComplaintStatusData,
    client: ComplaintTransitionClient = this.prisma,
  ): Promise<ComplaintStatusRecord | null> {
    const referenceNumber = await submittedReference(data, client);
    const updateData = {
      status: data.toStatus,
      ...(referenceNumber ? { referenceNumber } : {}),
      ...(data.targetBranchId ? { branchId: data.targetBranchId } : {}),
      ...(data.targetDepartmentId ? { departmentId: data.targetDepartmentId } : {}),
      ...(data.ownerId ? { ownerId: data.ownerId } : {}),
      ...(data.resolvedAt ? { resolvedAt: data.resolvedAt } : {}),
      ...(data.closedAt ? { closedAt: data.closedAt } : {}),
    };
    const update = await client.complaint.updateMany({
      where: { id: data.complaintId, status: data.fromStatus },
      data: updateData,
    });

    if (update.count === 0) {
      return null;
    }

    return client.complaint.findUniqueOrThrow({
      where: { id: data.complaintId },
      select: { id: true, branchId: true, status: true, ownerId: true, severity: true, categoryId: true, departmentId: true },
    });
  }

  async createStatusHistory(
    data: CreateComplaintStatusHistoryData,
    client: ComplaintTransitionClient = this.prisma,
  ): Promise<void> {
    await client.complaintStatusHistory.create({ data });
  }
}

const complaintSelect = { id: true, referenceNumber: true, branchId: true, status: true, subject: true, severity: true } satisfies Prisma.ComplaintSelect;

function customerPhone(data: CreateComplaintData): string {
  return data.customerPhone ?? `DMS-${data.customerNumber}`;
}

async function submittedReference(data: UpdateComplaintStatusData, client: ComplaintTransitionClient): Promise<string | null> {
  if (data.fromStatus !== 'DRAFT' || data.toStatus !== 'SUBMITTED') return null;
  const complaint = await client.complaint.findUnique({ where: { id: data.complaintId }, select: { branchId: true, referenceNumber: true } });
  if (!complaint || complaint.referenceNumber.startsWith('CMS-')) return null;
  return nextReferenceNumber(complaint.branchId, new Date(), client);
}
const commentSelect = { id: true, complaintId: true, authorId: true, body: true, visibility: true, createdAt: true } satisfies Prisma.CommentSelect;

function reportWhere(filter: ComplaintReportFilter): Prisma.ComplaintWhereInput {
  return {
    ...(filter.branchId ? { branchId: filter.branchId } : {}),
    ...(filter.referenceNumber ? { referenceNumber: { contains: filter.referenceNumber, mode: 'insensitive' } } : {}),
    ...(filter.customer ? { customer: { OR: customerSearch(filter.customer) } } : {}),
    ...(filter.status ? { status: filter.status } : {}),
    ...(filter.categoryId ? { categoryId: filter.categoryId } : {}),
    ...(filter.departmentId ? { departmentId: filter.departmentId } : {}),
    ...(filter.severity ? { severity: filter.severity } : {}),
    ...(filter.ownerId ? { ownerId: filter.ownerId } : {}),
    ...dateRange(filter),
  };
}

function customerSearch(value: string): Prisma.CustomerWhereInput[] {
  return ['nameEn', 'nameAr', 'phone', 'dmsCode'].map((field) => ({ [field]: { contains: value, mode: 'insensitive' } }));
}

function dateRange(filter: ComplaintReportFilter): Pick<Prisma.ComplaintWhereInput, 'createdAt'> {
  const range = { ...(filter.dateFrom ? { gte: new Date(filter.dateFrom) } : {}), ...(filter.dateTo ? { lte: new Date(filter.dateTo) } : {}) };
  return Object.keys(range).length ? { createdAt: range } : {};
}

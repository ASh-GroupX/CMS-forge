import { Injectable } from '@nestjs/common';
import type { CommentVisibility, ComplaintSeverity, ComplaintStatus, ComplaintTransitionAction, ComplaintTransitionRequestSource, Prisma, RoleCode } from '@prisma/client';
import { PrismaService } from '../../core/http-kernel.js';

type ComplaintTransitionClient = Pick<Prisma.TransactionClient, 'complaint' | 'complaintStatusHistory' | 'customer' | 'comment'>;

export type ComplaintStatusRecord = {
  id: string;
  branchId: string;
  status: ComplaintStatus;
};

export type ComplaintRecord = ComplaintStatusRecord & {
  referenceNumber: string;
  subject: string;
  severity: ComplaintSeverity;
};

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
  createdById?: string | null;
  descriptionEn: string;
  incidentAt: Date;
};

export type UpdateComplaintStatusData = {
  complaintId: string;
  fromStatus: ComplaintStatus;
  toStatus: ComplaintStatus;
};

export type CreateComplaintStatusHistoryData = {
  complaintId: string;
  fromStatus: ComplaintStatus | null;
  toStatus: ComplaintStatus;
  action: ComplaintTransitionAction;
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

  async nextReferenceNumber(client: ComplaintTransitionClient = this.prisma): Promise<string> {
    // ponytail: count-based references are enough until concurrent create load needs a DB sequence.
    const count = await client.complaint.count();
    return `CMP-${String(count + 1).padStart(6, '0')}`;
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

    return client.complaint.create({
      data: {
        referenceNumber: data.referenceNumber,
        status: data.status,
        subject: data.subject,
        severity: data.severity,
        branchId: data.branchId,
        categoryId: data.categoryId,
        customerId: customer.id,
        vehicleId: data.vehicleId ?? null,
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
    const update = await client.complaint.updateMany({
      where: { id: data.complaintId, status: data.fromStatus },
      data: { status: data.toStatus },
    });

    if (update.count === 0) {
      return null;
    }

    return client.complaint.findUniqueOrThrow({
      where: { id: data.complaintId },
      select: {
        id: true,
        branchId: true,
        status: true,
      },
    });
  }

  async createStatusHistory(
    data: CreateComplaintStatusHistoryData,
    client: ComplaintTransitionClient = this.prisma,
  ): Promise<void> {
    await client.complaintStatusHistory.create({ data });
  }
}

const complaintSelect = {
  id: true,
  referenceNumber: true,
  branchId: true,
  status: true,
  subject: true,
  severity: true,
} satisfies Prisma.ComplaintSelect;

function customerPhone(data: CreateComplaintData): string {
  return data.customerPhone ?? `DMS-${data.customerNumber}`;
}

const commentSelect = {
  id: true,
  complaintId: true,
  authorId: true,
  body: true,
  visibility: true,
  createdAt: true,
} satisfies Prisma.CommentSelect;

function reportWhere(filter: ComplaintReportFilter): Prisma.ComplaintWhereInput {
  return {
    ...(filter.branchId ? { branchId: filter.branchId } : {}),
    ...(filter.referenceNumber ? { referenceNumber: { contains: filter.referenceNumber, mode: 'insensitive' } } : {}),
    ...(filter.customer ? { customer: { OR: customerSearch(filter.customer) } } : {}),
    ...(filter.status ? { status: filter.status } : {}),
    ...(filter.categoryId ? { categoryId: filter.categoryId } : {}),
    ...(filter.severity ? { severity: filter.severity } : {}),
    ...(filter.ownerId ? { ownerId: filter.ownerId } : {}),
    ...dateRange(filter),
  };
}

function customerSearch(value: string): Prisma.CustomerWhereInput[] {
  return ['nameEn', 'nameAr', 'phone', 'dmsCode'].map((field) => ({ [field]: { contains: value, mode: 'insensitive' } }));
}

function dateRange(filter: ComplaintReportFilter): Pick<Prisma.ComplaintWhereInput, 'createdAt'> {
  const range = {
    ...(filter.dateFrom ? { gte: new Date(filter.dateFrom) } : {}),
    ...(filter.dateTo ? { lte: new Date(filter.dateTo) } : {}),
  };
  return Object.keys(range).length ? { createdAt: range } : {};
}

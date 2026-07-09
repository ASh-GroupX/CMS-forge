import { Injectable } from '@nestjs/common';
import { AuditEventType, NotificationChannel } from '@prisma/client';
import type { CommentVisibility, ComplaintSeverity, ComplaintStatus, ComplaintTransitionAction, ComplaintTransitionRequestSource, Prisma, RoleCode } from '@prisma/client';
import { PrismaService } from '../../core/http-kernel.js';
import type { ComplaintCorrectionData, ComplaintCorrectionRecord } from './complaint-correction.js';
import { correctionUpdateData } from './complaint-correction-update.js';
import { nextReferenceNumber, upsertVehicle } from './complaint-reference.repository.js';
import type { ComplaintReferenceClient } from './complaint-reference.repository.js';
import { reportWhere } from './complaints.report-query.js';

type ComplaintTransitionClient = Pick<Prisma.TransactionClient, 'comment' | 'complaint' | 'complaintStatusHistory' | 'customer'> & ComplaintReferenceClient;
export type DataSource = 'LOCAL' | 'MANUAL' | 'DMS';

export type ComplaintStatusRecord = { id: string; branchId: string; customerId: string; status: ComplaintStatus; ownerId: string | null; severity: ComplaintSeverity; categoryId: string; departmentId: string | null };
export type ComplaintTransitionSubject = { id: string; vehicleRelated: boolean; vehicleId: string | null; vehicleDataUnavailableReason: string | null };
export type ComplaintRecord = { id: string; branchId: string; customerId: string; status: ComplaintStatus; referenceNumber: string; subject: string; severity: ComplaintSeverity; categoryId: string; departmentId: string | null; ownerId: string | null };

export type ComplaintQueueRecord = ComplaintRecord & {
  ownerId: string | null;
  owner: { nameEn: string; email: string } | null; branch: { code: string; nameEn: string; nameAr: string };
  createdAt: Date;
  updatedAt: Date;
};

export type ComplaintDetailRecord = ComplaintQueueRecord & {
  descriptionEn: string; incidentAt: Date | null;
  customer: { id: string; nameEn: string; phone: string; dmsCode: string | null; dataSource: DataSource };
  vehicle: { id: string; vin: string; plate: string; makeEn: string; modelEn: string; year: number; dataSource: DataSource } | null;
  customerDataSource: DataSource; manualCustomerFlag: boolean;
  vehicleRelated: boolean; vehicleDataSource: DataSource | null; manualVehicleFlag: boolean;
  vehicleDataUnavailableReason: string | null;
  statusHistory: Array<{ id: string; fromStatus: ComplaintStatus | null; toStatus: ComplaintStatus; action: ComplaintTransitionAction | null; actorId: string | null; actorRole: RoleCode | null; requestSource: ComplaintTransitionRequestSource | null; reason: string | null; correlationId: string | null; createdAt: Date }>;
};

export type CreateComplaintData = {
  referenceNumber: string; status: ComplaintStatus; subject: string; severity: ComplaintSeverity;
  branchId: string; categoryId: string; customerName: string; customerPhone?: string | null; customerNumber?: string | null;
  customerDataSource: DataSource; manualCustomerFlag: boolean;
  vehicleId?: string | null; vehicleVin?: string | null; vehiclePlate?: string | null; vehicleBrand?: string | null; vehicleModel?: string | null; vehicleModelYear?: number | null;
  vehicleDataSource?: DataSource | null; manualVehicleFlag: boolean; vehicleRelated: boolean; vehicleDataUnavailableReason?: string | null;
  departmentId?: string | null; createdById?: string | null; descriptionEn: string; incidentAt: Date;
};

export type UpdateComplaintStatusData = { complaintId: string; fromStatus: ComplaintStatus; toStatus: ComplaintStatus; targetBranchId?: string | null; targetDepartmentId?: string | null; ownerId?: string | null; resolvedAt?: Date | null; closedAt?: Date | null; vehicleDataUnavailableReason?: string | null };

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

export type ListComplaintQueueFilter = { branchId?: string | null; role?: RoleCode | null };

export type ComplaintReportFilter = ListComplaintQueueFilter & {
  dateFrom?: Date | string | null;
  dateTo?: Date | string | null;
  limit?: number | null;
  offset?: number | null;
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
export type ComplaintTimelineFacts = {
  attachmentAudits: Prisma.AuditLogGetPayload<{ select: typeof timelineAttachmentAuditSelect }>[];
  attachments: Prisma.AttachmentGetPayload<{ select: typeof timelineAttachmentSelect }>[];
  comments: Prisma.CommentGetPayload<{ select: typeof timelineCommentSelect }>[];
  notifications: Prisma.NotificationGetPayload<{ select: typeof timelineNotificationSelect }>[];
  slaEvents: Prisma.SlaEventGetPayload<{ select: typeof timelineSlaSelect }>[];
  statusHistory: Prisma.ComplaintStatusHistoryGetPayload<{ select: typeof timelineStatusSelect }>[];
};

@Injectable()
export class ComplaintsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async transaction<T>(work: (client: Prisma.TransactionClient) => Promise<T>): Promise<T> { return this.prisma.$transaction(work); }

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
        dataSource: data.customerDataSource,
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
        customerDataSource: data.customerDataSource,
        manualCustomerFlag: data.manualCustomerFlag,
        vehicleDataSource: data.vehicleDataSource ?? null,
        manualVehicleFlag: data.manualVehicleFlag,
        vehicleRelated: data.vehicleRelated,
        vehicleDataUnavailableReason: data.vehicleDataUnavailableReason ?? null,
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
      ...(filter.offset === null || filter.offset === undefined ? {} : { skip: filter.offset }),
      ...(filter.limit === null || filter.limit === undefined ? {} : { take: filter.limit }),
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
        descriptionEn: true, incidentAt: true,
        customer: { select: { id: true, nameEn: true, phone: true, dmsCode: true, dataSource: true } },
        vehicle: { select: { id: true, vin: true, plate: true, makeEn: true, modelEn: true, year: true, dataSource: true } },
        customerDataSource: true, manualCustomerFlag: true,
        vehicleRelated: true, vehicleDataSource: true, manualVehicleFlag: true, vehicleDataUnavailableReason: true,
        createdAt: true, updatedAt: true,
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

  async listComments(complaintId: string, client: ComplaintTransitionClient = this.prisma): Promise<ComplaintCommentRecord[]> { return client.comment.findMany({ where: { complaintId }, orderBy: { createdAt: 'asc' }, select: commentSelect }); }

  async listPublicComments(complaintId: string, client: ComplaintTransitionClient = this.prisma): Promise<ComplaintCommentRecord[]> { return client.comment.findMany({ where: { complaintId, visibility: 'PUBLIC' }, orderBy: { createdAt: 'asc' }, select: commentSelect }); }

  async timelineFacts(complaintId: string): Promise<ComplaintTimelineFacts> {
    const [statusHistory, comments, slaEvents, notifications, attachments, attachmentAudits] = await Promise.all([
      this.prisma.complaintStatusHistory.findMany({ where: { complaintId }, orderBy: { createdAt: 'asc' }, select: timelineStatusSelect }),
      this.prisma.comment.findMany({ where: { complaintId }, orderBy: { createdAt: 'asc' }, select: timelineCommentSelect }),
      this.prisma.slaEvent.findMany({ where: { complaintId }, orderBy: { occurredAt: 'asc' }, select: timelineSlaSelect }),
      this.prisma.notification.findMany({ where: { complaintId, channel: NotificationChannel.IN_APP }, orderBy: { queuedAt: 'asc' }, select: timelineNotificationSelect }),
      this.prisma.attachment.findMany({ where: { complaintId }, orderBy: { createdAt: 'asc' }, select: timelineAttachmentSelect }),
      this.prisma.auditLog.findMany({ where: { eventType: AuditEventType.ATTACHMENT, metadata: { path: ['complaintId'], equals: complaintId } }, orderBy: { createdAt: 'asc' }, select: timelineAttachmentAuditSelect }),
    ]);
    return { attachmentAudits, attachments, comments, notifications, slaEvents, statusHistory };
  }

  async findPortalVerificationTarget(referenceNumber: string, phone: string, client: ComplaintTransitionClient = this.prisma): Promise<PortalVerificationTargetRecord | null> {
    const complaint = await client.complaint.findFirst({
      where: { referenceNumber, customer: { phone } },
      select: { id: true, customerId: true, customer: { select: { phone: true } } },
    });
    return complaint ? { complaintId: complaint.id, customerId: complaint.customerId, phone: complaint.customer.phone } : null;
  }

  async findTransitionSubject(id: string, client: ComplaintTransitionClient = this.prisma): Promise<ComplaintTransitionSubject | null> {
    return client.complaint.findUnique({
      where: { id },
      select: { id: true, vehicleRelated: true, vehicleId: true, vehicleDataUnavailableReason: true },
    });
  }

  async updateCorrection(data: ComplaintCorrectionData, client: ComplaintTransitionClient = this.prisma): Promise<ComplaintCorrectionRecord | null> { const update = await client.complaint.updateMany({ where: { id: data.complaintId, updatedAt: data.expectedUpdatedAt }, data: correctionUpdateData(data) }); return update.count === 0 ? null : client.complaint.findUniqueOrThrow({ where: { id: data.complaintId }, select: { id: true, branchId: true } }); }

  async updateStatus(data: UpdateComplaintStatusData, client: ComplaintTransitionClient = this.prisma): Promise<ComplaintStatusRecord | null> {
    const referenceNumber = await submittedReference(data, client);
    const updateData = {
      status: data.toStatus,
      ...(referenceNumber ? { referenceNumber } : {}),
      ...(data.targetBranchId ? { branchId: data.targetBranchId } : {}),
      ...(data.targetDepartmentId ? { departmentId: data.targetDepartmentId } : {}),
      ...(data.ownerId ? { ownerId: data.ownerId } : {}),
      ...(data.resolvedAt ? { resolvedAt: data.resolvedAt } : {}),
      ...(data.closedAt ? { closedAt: data.closedAt } : {}),
      ...(data.vehicleDataUnavailableReason ? { vehicleDataUnavailableReason: data.vehicleDataUnavailableReason } : {}),
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
      select: { id: true, branchId: true, customerId: true, status: true, ownerId: true, severity: true, categoryId: true, departmentId: true },
    });
  }

  async createStatusHistory(data: CreateComplaintStatusHistoryData, client: ComplaintTransitionClient = this.prisma): Promise<void> { await client.complaintStatusHistory.create({ data }); }
}

const complaintSelect = { id: true, referenceNumber: true, branchId: true, customerId: true, status: true, subject: true, severity: true, categoryId: true, departmentId: true, ownerId: true } satisfies Prisma.ComplaintSelect;

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

const timelineStatusSelect = {
  id: true, fromStatus: true, toStatus: true, action: true, actorId: true, actorRole: true, requestSource: true, reason: true, correlationId: true, createdAt: true,
  actor: { select: { nameEn: true } },
} satisfies Prisma.ComplaintStatusHistorySelect;

const timelineCommentSelect = {
  id: true, complaintId: true, authorId: true, body: true, visibility: true, createdAt: true,
  author: { select: { nameEn: true } },
} satisfies Prisma.CommentSelect;

const timelineSlaSelect = { id: true, type: true, stage: true, dueAt: true, occurredAt: true } satisfies Prisma.SlaEventSelect;
const timelineAttachmentSelect = { id: true, fileName: true, contentType: true, sizeBytes: true, scanStatus: true, customerVisible: true, uploadedById: true, createdAt: true, uploadedBy: { select: { nameEn: true } } } satisfies Prisma.AttachmentSelect;
const timelineAttachmentAuditSelect = { id: true, action: true, actorId: true, targetId: true, createdAt: true, metadata: true, actor: { select: { nameEn: true } } } satisfies Prisma.AuditLogSelect;
const timelineNotificationSelect = { id: true, recipientUserId: true, status: true, templateCode: true, payload: true, queuedAt: true, sentAt: true, recipientUser: { select: { nameEn: true } } } satisfies Prisma.NotificationSelect;

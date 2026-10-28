import { Injectable } from '@nestjs/common';
import { AuditEventType, NotificationChannel } from '@prisma/client';
import type { CommentVisibility, ComplaintSeverity, ComplaintStatus, ComplaintTransitionAction, ComplaintTransitionRequestSource, Prisma, RoleCode } from '@prisma/client';
import { PrismaService } from '../../core/http-kernel.js';
import type { ComplaintCorrectionData, ComplaintCorrectionRecord } from './complaint-correction.js';
import { correctionUpdateData } from './complaint-correction-update.js';
import { nextReferenceNumber, upsertVehicle } from './complaint-reference.repository.js';
import type { ComplaintReferenceClient } from './complaint-reference.repository.js';
import { reportWhere } from './complaints.report-query.js';

type ComplaintTransitionClient = Pick<Prisma.TransactionClient, 'comment' | 'complaint' | 'complaintStatusHistory' | 'customer' | 'complaintWatcher'> & ComplaintReferenceClient;
export type DataSource = 'LOCAL' | 'MANUAL' | 'DMS';

export type ComplaintStatusRecord = { id: string; branchId: string; customerId: string; status: ComplaintStatus; ownerId: string | null; backupOfficerId?: string | null; severity: ComplaintSeverity; categoryId: string; departmentId: string | null; createdById: string | null; referenceNumber: string };
export type ComplaintTransitionSubject = { id: string; vehicleRelated: boolean; vehicleId: string | null; vehicleDataUnavailableReason: string | null };
export type ComplaintRecord = { id: string; branchId: string; customerId: string; status: ComplaintStatus; type: any; referenceNumber: string; subject: string; severity: ComplaintSeverity; categoryId: string; departmentId: string | null; ownerId: string | null; backupOfficerId?: string | null; createdById: string | null; resolvedAt: Date | null; closedAt: Date | null; templateId?: string | null; templateData?: any; };

export type ComplaintQueueRecord = ComplaintRecord & { ownerId: string | null; backupOfficerId?: string | null; owner: { nameEn: string; nameAr?: string | null; email?: string | null; phone?: string | null } | null; backupOfficer?: { nameEn: string; nameAr?: string | null; email?: string | null; phone?: string | null } | null; department?: { nameEn: string; nameAr: string } | null; category?: { id: string; nameEn: string; nameAr: string } | null; branch: { code: string; nameEn: string; nameAr: string; timezone: string }; createdAt: Date; updatedAt: Date };
export type ComplaintDetailRecord = Omit<ComplaintQueueRecord, 'category'> & {
  category: { id: string; nameEn: string; nameAr: string };
  descriptionEn: string;
  descriptionAr?: string | null;
  incidentAt: Date | null;
  customer: { id: string; nameEn: string; phone: string; dmsCode: string | null; dataSource: DataSource };
  vehicle: { id: string; vin: string; plate: string; makeEn: string; modelEn: string; year: number; dataSource: DataSource } | null;
  customerDataSource: DataSource;
  manualCustomerFlag: boolean;
  vehicleRelated: boolean;
  vehicleDataSource: DataSource | null;
  manualVehicleFlag: boolean;
  vehicleDataUnavailableReason: string | null;
  templateId?: string | null;
  templateData?: any;
  alternativeCarProvided?: boolean;
  backupOfficerId?: string | null;
  backupOfficer?: { nameEn: string; email?: string | null; phone?: string | null } | null;
  collaboratorId?: string | null;
  collaborator?: { nameEn: string; email?: string | null; phone?: string | null } | null;
  isJustified?: boolean | null;
  satisfactionStatus?: string | null;
  investigationNotes?: string | null;
  investigatedAt?: Date | null;
  salesAdvisorName?: string | null;
  rootCauseCategory?: string | null;
  channel?: string | null;
  customerType?: string | null;
  lastServiceDate?: Date | null;
  odometer?: number | null;
  warrantyActive?: boolean | null;
  repeatCustomer?: boolean | null;
  createdById?: string | null;
  createdBy?: { nameEn: string; nameAr: string; phone?: string | null } | null;
  statusHistory: Array<{ id: string; fromStatus: ComplaintStatus | null; toStatus: ComplaintStatus; action: ComplaintTransitionAction | null; actorId: string | null; actorRole: string | null; requestSource: ComplaintTransitionRequestSource | null; reason: string | null; correlationId: string | null; createdAt: Date; actor: { nameEn: string; nameAr: string; phone?: string | null; department: { nameEn: string; nameAr: string } | null } | null }>;
};
export type CreateComplaintData = {
  referenceNumber: string; status: ComplaintStatus; type: any; subject: string; severity: ComplaintSeverity; branchId: string; categoryId: string; customerName: string; customerPhone?: string | null; customerNumber?: string | null; customerDataSource: DataSource; manualCustomerFlag: boolean; vehicleId?: string | null; vehicleVin?: string | null; vehiclePlate?: string | null; vehicleBrand?: string | null; vehicleModel?: string | null; vehicleModelYear?: number | null; vehicleDataSource?: DataSource | null; manualVehicleFlag: boolean; vehicleRelated: boolean; vehicleDataUnavailableReason?: string | null; channel?: string | null; customerType?: string | null; lastServiceDate?: Date | null; odometer?: number | null; warrantyActive?: boolean | null; salesAdvisorName?: string | null; rootCauseCategory?: string | null; repeatCustomer?: boolean | null; departmentId?: string | null; ownerId?: string | null; backupOfficerId?: string | null; collaboratorId?: string | null; alternativeCarProvided?: boolean; createdById?: string | null; descriptionEn: string; incidentAt: Date; templateId?: string | null; templateData?: any;
};

export type UpdateComplaintStatusData = {
  complaintId: string; fromStatus: ComplaintStatus; toStatus: ComplaintStatus; targetBranchId?: string | null; targetDepartmentId?: string | null; ownerId?: string | null; resolvedAt?: Date | null; closedAt?: Date | null; vehicleDataUnavailableReason?: string | null; isJustified?: boolean | null; satisfactionStatus?: string | null; investigationNotes?: string | null; investigatedAt?: Date | null;
};

export type CreateComplaintStatusHistoryData = { complaintId: string; fromStatus: ComplaintStatus | null; toStatus: ComplaintStatus; action: ComplaintTransitionAction | null; actorId?: string | null; actorRole: string | null; requestSource: ComplaintTransitionRequestSource; reason?: string | null; correlationId?: string | null };

export type ListComplaintQueueFilter = { branchId?: string | null; role?: string | null; userId?: string | null; userDepartmentId?: string | null; permissions?: string[]; departmentId?: string | null; direction?: 'RECEIVED' | 'SENT' | 'ALL' | null };

export type ComplaintReportFilter = ListComplaintQueueFilter & { dateFrom?: Date | string | null; dateTo?: Date | string | null; limit?: number | null; offset?: number | null; referenceNumber?: string | null; customer?: string | null; status?: ComplaintStatus | null; categoryId?: string | null; departmentId?: string | null; severity?: ComplaintSeverity | null; ownerId?: string | null; ownerUnassigned?: boolean; rootCauseCategory?: string | null };

export type ComplaintReportRecord = ComplaintQueueRecord & {
  categoryId: string;
};

export type ComplaintSearchRecord = ComplaintReportRecord & {
  customerName: string;
  customerPhone: string;
  customerIdentifier: string | null;
};

export type ComplaintCommentRecord = Prisma.CommentGetPayload<{ select: typeof commentSelect }>;
export type PortalVerificationTargetRecord = { complaintId: string; customerId: string; phone: string };
export type CreateComplaintCommentData = { complaintId: string; authorId?: string | null; body: string; visibility: CommentVisibility; mentions?: { recipientUserId: string; source: 'USER' | 'SYSTEM_ROLE' | 'SYSTEM_DEPARTMENT' | 'CUSTOM_GROUP'; sourceId: string | null; sourceLabel: string }[] };
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
        type: data.type,
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
        channel: data.channel ?? null,
        customerType: data.customerType ?? null,
        lastServiceDate: data.lastServiceDate ?? null,
        odometer: data.odometer ?? null,
        warrantyActive: data.warrantyActive ?? null,
        salesAdvisorName: data.salesAdvisorName ?? null,
        rootCauseCategory: data.rootCauseCategory ?? null,
        repeatCustomer: data.repeatCustomer ?? null,
        departmentId: data.departmentId ?? null,
        ownerId: data.ownerId ?? null,
        backupOfficerId: data.backupOfficerId ?? null,
        collaboratorId: data.collaboratorId ?? null,
        alternativeCarProvided: data.alternativeCarProvided ?? false,
        createdById: data.createdById ?? null,
        descriptionEn: data.descriptionEn,
        incidentAt: data.incidentAt,
        templateId: data.templateId ?? null,
        templateData: data.templateData !== undefined ? data.templateData : undefined,
      },
      select: complaintSelect,
    });
  }

  async listQueue(filter: ListComplaintQueueFilter = {}, client: ComplaintTransitionClient = this.prisma): Promise<ComplaintQueueRecord[]> {
    const where: Prisma.ComplaintWhereInput = { AND: [] };

    if (filter.departmentId) {
      (where.AND as any[]).push({ departmentId: filter.departmentId });
    }

    const isGlobalManager = filter.role === 'CR_MANAGER' || filter.role === 'ADMIN' || filter.permissions?.includes('COMPLAINT_VIEW_ALL');
    const isBranchManager = filter.role === 'BRANCH_MANAGER';

    if (isGlobalManager) {
      if (filter.branchId) (where.AND as any[]).push({ branchId: filter.branchId });
    } else if (isBranchManager) {
      if (filter.branchId) (where.AND as any[]).push({ branchId: filter.branchId });
      if (filter.userDepartmentId) {
        (where.AND as any[]).push({
          OR: [
            { departmentId: filter.userDepartmentId },
            { ownerId: filter.userId },
            { createdById: filter.userId },
            { backupOfficerId: filter.userId },
            { collaboratorId: filter.userId },
          ],
        });
      }
    } else if (filter.userId) {
      if (filter.branchId) (where.AND as any[]).push({ branchId: filter.branchId });
      if (!filter.direction) {
        const staffOr: Prisma.ComplaintWhereInput[] = [
          { ownerId: filter.userId },
          { backupOfficerId: filter.userId },
          { collaboratorId: filter.userId },
          { createdById: filter.userId },
        ];
        if (filter.userDepartmentId) {
          staffOr.push({ departmentId: filter.userDepartmentId });
        }
        (where.AND as any[]).push({ OR: staffOr });
      }
    }

    if (filter.direction === 'SENT' && filter.userId) {
      (where.AND as any[]).push({ createdById: filter.userId });
    } else if (filter.direction === 'RECEIVED' && filter.userId) {
      const receivedOr: Prisma.ComplaintWhereInput[] = [
        { ownerId: filter.userId },
        { backupOfficerId: filter.userId },
        { collaboratorId: filter.userId },
      ];
      if (filter.userDepartmentId) {
        receivedOr.push({ departmentId: filter.userDepartmentId });
      }
      (where.AND as any[]).push({ OR: receivedOr });
    }

    if ((where.AND as any[]).length === 0) {
      delete where.AND;
    }

    return client.complaint.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { referenceNumber: 'asc' }],
      select: { ...complaintSelect, ownerId: true, owner: { select: { nameEn: true, nameAr: true, email: true } }, backupOfficer: { select: { nameEn: true, nameAr: true, email: true } }, department: { select: { nameEn: true, nameAr: true } }, category: { select: { id: true, nameEn: true, nameAr: true } }, branch: { select: { code: true, nameEn: true, nameAr: true, timezone: true } }, createdAt: true, updatedAt: true },
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
        ownerId: true, owner: { select: { nameEn: true, nameAr: true, email: true } }, backupOfficer: { select: { nameEn: true, nameAr: true, email: true } }, department: { select: { nameEn: true, nameAr: true } }, branch: { select: { code: true, nameEn: true, nameAr: true, timezone: true } },
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
    const where: Prisma.ComplaintWhereInput = { id, AND: [] };
    
    const isGlobalManager = filter.role === 'CR_MANAGER' || filter.role === 'ADMIN' || filter.permissions?.includes('COMPLAINT_VIEW_ALL');
    const isBranchManager = filter.role === 'BRANCH_MANAGER';

    if (isGlobalManager) {
      if (filter.branchId) (where.AND as any[]).push({ branchId: filter.branchId });
    } else if (isBranchManager) {
      if (filter.branchId) (where.AND as any[]).push({ branchId: filter.branchId });
      if (filter.userDepartmentId) {
        (where.AND as any[]).push({
          OR: [
            { departmentId: filter.userDepartmentId },
            { ownerId: filter.userId },
            { createdById: filter.userId },
            { backupOfficerId: filter.userId },
            { collaboratorId: filter.userId },
          ],
        });
      }
    } else if (filter.userId) {
      if (filter.branchId) (where.AND as any[]).push({ branchId: filter.branchId });
      const staffOr: Prisma.ComplaintWhereInput[] = [
        { ownerId: filter.userId },
        { backupOfficerId: filter.userId },
        { collaboratorId: filter.userId },
        { createdById: filter.userId },
      ];
      if (filter.userDepartmentId) {
        staffOr.push({ departmentId: filter.userDepartmentId });
      }
      (where.AND as any[]).push({ OR: staffOr });
    }

    if ((where.AND as any[]).length === 0) {
      delete where.AND;
    }

    return client.complaint.findFirst({
      where,
      select: {
        ...complaintSelect,
        ownerId: true, owner: { select: { nameEn: true, email: true, phone: true } }, department: { select: { nameEn: true, nameAr: true } }, branch: { select: { code: true, nameEn: true, nameAr: true, timezone: true } },
        descriptionEn: true, descriptionAr: true, incidentAt: true,
        category: { select: { id: true, nameEn: true, nameAr: true } },
        customer: { select: { id: true, nameEn: true, phone: true, dmsCode: true, dataSource: true } },
        vehicle: { select: { id: true, vin: true, plate: true, makeEn: true, modelEn: true, year: true, dataSource: true } },
        customerDataSource: true, manualCustomerFlag: true,
        vehicleRelated: true, vehicleDataSource: true, manualVehicleFlag: true, vehicleDataUnavailableReason: true,
        alternativeCarProvided: true,
        backupOfficerId: true,
        backupOfficer: { select: { nameEn: true, email: true, phone: true } },
        collaboratorId: true,
        collaborator: { select: { nameEn: true, email: true, phone: true } },
        isJustified: true,
        satisfactionStatus: true,
        investigationNotes: true,
        investigatedAt: true,
        salesAdvisorName: true,
        rootCauseCategory: true,
        channel: true,
        customerType: true,
        lastServiceDate: true,
        odometer: true,
        warrantyActive: true,
        repeatCustomer: true,
        createdById: true,
        createdBy: { select: { nameEn: true, nameAr: true, phone: true } },
        createdAt: true, updatedAt: true,
        statusHistory: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true, fromStatus: true, toStatus: true, action: true, actorId: true,
            actorRole: true, requestSource: true, reason: true, correlationId: true, createdAt: true,
            actor: { select: { nameEn: true, nameAr: true, phone: true, department: { select: { nameEn: true, nameAr: true } } } },
          },
        },
      },
    });
  }

  async createComment(data: CreateComplaintCommentData, client: ComplaintTransitionClient = this.prisma): Promise<ComplaintCommentRecord> {
    const createData: Prisma.CommentCreateInput = {
      body: data.body,
      visibility: data.visibility,
      complaint: { connect: { id: data.complaintId } },
      ...(data.authorId ? { author: { connect: { id: data.authorId } } } : {}),
      ...(data.mentions?.length ? { mentions: { create: data.mentions } } : {}),
    };
    return client.comment.create({ data: createData, select: commentSelect });
  }

  async listComments(complaintId: string, client: ComplaintTransitionClient = this.prisma): Promise<ComplaintCommentRecord[]> { return client.comment.findMany({ where: { complaintId }, orderBy: { createdAt: 'asc' }, select: commentSelect }); }

  async listPublicComments(complaintId: string, client: ComplaintTransitionClient = this.prisma): Promise<ComplaintCommentRecord[]> { return client.comment.findMany({ where: { complaintId, visibility: 'PUBLIC' }, orderBy: { createdAt: 'asc' }, select: commentSelect }); }

  async addWatcher(complaintId: string, userId: string, addedById: string, client: ComplaintTransitionClient): Promise<void> {
    await client.complaintWatcher.upsert({ where: { complaintId_userId: { complaintId, userId } }, create: { complaintId, userId, addedById }, update: {} });
  }

  async removeWatcher(complaintId: string, userId: string, client: ComplaintTransitionClient): Promise<boolean> {
    const result = await client.complaintWatcher.deleteMany({ where: { complaintId, userId } });
    return result.count === 1;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // Delete dependent records first to avoid foreign key constraints
      await tx.complaintWatcher.deleteMany({ where: { complaintId: id } });
      const comments = await tx.comment.findMany({ where: { complaintId: id }, select: { id: true } });
      const commentIds = comments.map((c) => c.id);
      if (commentIds.length > 0) {
        await tx.complaintCommentMention.deleteMany({ where: { commentId: { in: commentIds } } });
      }
      await tx.comment.deleteMany({ where: { complaintId: id } });
      await tx.approval.deleteMany({ where: { complaintId: id } });
      await tx.complaintStatusHistory.deleteMany({ where: { complaintId: id } });
      await tx.complaintRelation.deleteMany({ where: { sourceComplaintId: id } });
      await tx.complaintRelation.deleteMany({ where: { targetComplaintId: id } });
      await tx.slaEvent.deleteMany({ where: { complaintId: id } });
      const notifs = await tx.notification.findMany({ where: { complaintId: id }, select: { id: true } });
      const notifIds = notifs.map((n) => n.id);
      if (notifIds.length > 0) {
        await tx.notificationDeliveryAttempt.deleteMany({ where: { notificationId: { in: notifIds } } });
      }
      await tx.notificationDigestItem.deleteMany({ where: { recordId: id } });
      await tx.notification.deleteMany({ where: { complaintId: id } });
      await tx.survey.deleteMany({ where: { complaintId: id } });
      await tx.compensation.deleteMany({ where: { complaintId: id } });
      await tx.portalVerification.deleteMany({ where: { complaintId: id } });
      await tx.portalSession.deleteMany({ where: { complaintId: id } });
      await tx.attachment.deleteMany({ where: { complaintId: id } });
      const assignments = await tx.assignment.findMany({ where: { entityType: 'COMPLAINT', entityId: id }, select: { id: true } });
      const assignmentIds = assignments.map((a) => a.id);
      if (assignmentIds.length > 0) {
        await tx.assignmentHistory.deleteMany({ where: { assignmentId: { in: assignmentIds } } });
      }
      await tx.assignmentHistory.deleteMany({ where: { entityType: 'COMPLAINT', entityId: id } });
      await tx.assignment.deleteMany({ where: { entityType: 'COMPLAINT', entityId: id } });
      await tx.caseLink.deleteMany({ where: { entityType: 'COMPLAINT', entityId: id } });

      // Remove linked Tasks
      const linkedTasks = await tx.taskLink.findMany({ where: { entityType: 'COMPLAINT', entityId: id }, select: { taskId: true } });
      const linkedTaskIds = linkedTasks.map((t) => t.taskId);
      if (linkedTaskIds.length > 0) {
        const taskAssignments = await tx.assignment.findMany({ where: { entityType: 'TASK', entityId: { in: linkedTaskIds } }, select: { id: true } });
        const taskAssignmentIds = taskAssignments.map((a) => a.id);
        if (taskAssignmentIds.length > 0) {
          await tx.assignmentHistory.deleteMany({ where: { assignmentId: { in: taskAssignmentIds } } });
        }
        await tx.assignmentHistory.deleteMany({ where: { entityType: 'TASK', entityId: { in: linkedTaskIds } } });
        await tx.assignment.deleteMany({ where: { entityType: 'TASK', entityId: { in: linkedTaskIds } } });
        await tx.taskLink.deleteMany({ where: { taskId: { in: linkedTaskIds } } });
        await tx.task.deleteMany({ where: { id: { in: linkedTaskIds } } });
      }
      await tx.taskLink.deleteMany({ where: { entityId: id } });

      // Finally delete the complaint
      await tx.complaint.delete({ where: { id } });
    });
  }

  async listWatchers(complaintId: string) {
    return this.prisma.complaintWatcher.findMany({ where: { complaintId }, select: { userId: true, user: { select: { email: true, nameEn: true, nameAr: true } } } });
  }

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
      ...(data.targetDepartmentId !== undefined ? { departmentId: data.targetDepartmentId } : {}),
      ...(data.ownerId !== undefined ? { ownerId: data.ownerId } : {}),
      ...(data.resolvedAt ? { resolvedAt: data.resolvedAt } : {}),
      ...(data.closedAt ? { closedAt: data.closedAt } : {}),
      ...(data.vehicleDataUnavailableReason ? { vehicleDataUnavailableReason: data.vehicleDataUnavailableReason } : {}),
      ...(data.isJustified !== undefined ? { isJustified: data.isJustified } : {}),
      ...(data.satisfactionStatus !== undefined ? { satisfactionStatus: data.satisfactionStatus } : {}),
      ...(data.investigationNotes !== undefined ? { investigationNotes: data.investigationNotes } : {}),
      ...(data.investigatedAt ? { investigatedAt: data.investigatedAt } : {}),
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
      select: { id: true, branchId: true, customerId: true, status: true, ownerId: true, backupOfficerId: true, severity: true, categoryId: true, departmentId: true, createdById: true, referenceNumber: true },
    });
  }

  async createStatusHistory(data: CreateComplaintStatusHistoryData, client: ComplaintTransitionClient = this.prisma): Promise<void> { await client.complaintStatusHistory.create({ data }); }
}

const complaintSelect = { id: true, referenceNumber: true, branchId: true, customerId: true, status: true, type: true, subject: true, severity: true, categoryId: true, departmentId: true, ownerId: true, backupOfficerId: true, createdById: true, resolvedAt: true, closedAt: true, templateId: true, templateData: true } satisfies Prisma.ComplaintSelect;

function customerPhone(data: CreateComplaintData): string {
  return data.customerPhone ?? `DMS-${data.customerNumber}`;
}

async function submittedReference(data: UpdateComplaintStatusData, client: ComplaintTransitionClient): Promise<string | null> {
  if (data.fromStatus !== 'DRAFT' || data.toStatus !== 'SUBMITTED') return null;
  const complaint = await client.complaint.findUnique({ where: { id: data.complaintId }, select: { branchId: true, referenceNumber: true } });
  if (!complaint || complaint.referenceNumber.startsWith('CMS-')) return null;
  return nextReferenceNumber(complaint.branchId, new Date(), client);
}
const commentSelect = { id: true, complaintId: true, authorId: true, body: true, visibility: true, createdAt: true, author: { select: { nameEn: true, nameAr: true } }, mentions: { select: { recipientUserId: true, source: true, sourceId: true, sourceLabel: true, recipientUser: { select: { nameEn: true, nameAr: true } } } } } satisfies Prisma.CommentSelect;

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

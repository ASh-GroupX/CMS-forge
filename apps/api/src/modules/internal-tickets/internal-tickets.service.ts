import { Injectable, NotFoundException, BadRequestException, Inject, HttpStatus } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import * as path from 'node:path';
import { AppException } from '../../core/http-kernel.js';
import { InternalTicketsRepository } from './internal-tickets.repository.js';
import { InternalTicketStatus, InternalTicketPriority } from '@prisma/client';
import { CreateInternalTicketDto } from './dto/create-internal-ticket.dto.js';
import { TransferTicketDto, AssignTicketDto, ResolveTicketDto, WaitTicketDto, RejectTicketDto, AddNoteDto } from './dto/update-internal-ticket.dto.js';
import { AttachmentsService } from '../attachments/attachments.service.js';
import { UploadTicketAttachmentDto } from './dto/upload-attachment.dto.js';

const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024;

function validateJpgAttachment(attachment: UploadTicketAttachmentDto) {
  const ext = path.extname(attachment.fileName || '').toLowerCase().replace('.', '');
  const mime = (attachment.contentType || '').toLowerCase().trim();
  const isJpgExt = ext === 'jpg' || ext === 'jpeg';
  const isJpgMime = mime === 'image/jpeg' || mime === 'image/jpg' || mime === 'image/pjpeg';
  if (!isJpgExt && !isJpgMime) {
    throw new AppException('ATTACHMENT_TYPE_BLOCKED', 'Only JPG images are allowed', HttpStatus.BAD_REQUEST);
  }
  if (attachment.sizeBytes > MAX_ATTACHMENT_SIZE) {
    throw new AppException('ATTACHMENT_SIZE_EXCEEDED', 'File exceeds 5MB limit', HttpStatus.BAD_REQUEST);
  }
}

@Injectable()
export class InternalTicketsService {
  constructor(
    private readonly repository: InternalTicketsRepository,
    private readonly attachmentsService: AttachmentsService,
  ) {}

  private async storeTicketAttachments(tx: any, ticketId: string, actorId: string, attachments: UploadTicketAttachmentDto[]) {
    for (const attachment of attachments) {
      validateJpgAttachment(attachment);
      const ext = (path.extname(attachment.fileName || '') || '.jpg').toLowerCase();
      const finalExt = ext === '.jpeg' ? '.jpeg' : '.jpg';
      const stored = await this.attachmentsService.storeObject({
        storageKey: `attachments/${randomUUID()}${finalExt}`,
        bytes: Buffer.from(attachment.contentBase64, 'base64'),
        contentType: 'image/jpeg',
      });

      await tx.ticketAttachment.create({
        data: {
          ticketId,
          uploadedById: actorId,
          storageKey: stored.storageKey,
          fileName: attachment.fileName,
          contentType: 'image/jpeg',
          sizeBytes: attachment.sizeBytes,
        },
      });
    }
  }

  private async storeNoteAttachments(tx: any, noteId: string, actorId: string, attachments: UploadTicketAttachmentDto[]) {
    for (const attachment of attachments) {
      validateJpgAttachment(attachment);
      const ext = (path.extname(attachment.fileName || '') || '.jpg').toLowerCase();
      const finalExt = ext === '.jpeg' ? '.jpeg' : '.jpg';
      const stored = await this.attachmentsService.storeObject({
        storageKey: `attachments/${randomUUID()}${finalExt}`,
        bytes: Buffer.from(attachment.contentBase64, 'base64'),
        contentType: 'image/jpeg',
      });

      await tx.ticketNoteAttachment.create({
        data: {
          noteId,
          uploadedById: actorId,
          storageKey: stored.storageKey,
          fileName: attachment.fileName,
          contentType: 'image/jpeg',
          sizeBytes: attachment.sizeBytes,
        },
      });
    }
  }

  private async logActivity(tx: any, ticketId: string, actorId: string, action: string, details?: any) {
    await tx.ticketActivity.create({
      data: {
        ticketId,
        actorId,
        action,
        details: details || {},
      },
    });
  }

  async create(principal: any, dto: CreateInternalTicketDto) {
    const actorId = principal.userId;
    return this.repository.transaction(async (tx) => {
      const refNumber = `TKT-${Date.now()}`;
      
      if (principal.roleCode !== 'ADMIN' && principal.departmentId) {
        const senderDeptId = principal.departmentId;
        const targetDeptId = dto.targetDepartmentId;

        const [senderDept, targetDept] = await Promise.all([
          tx.department.findUnique({
            where: { id: senderDeptId },
            select: { nameEn: true, allowedSendToDepartmentIds: true },
          }),
          tx.department.findUnique({
            where: { id: targetDeptId },
            select: { nameEn: true, allowedReceiveFromDepartmentIds: true },
          }),
        ]);

        if (senderDept?.allowedSendToDepartmentIds && senderDept.allowedSendToDepartmentIds.length > 0) {
          if (!senderDept.allowedSendToDepartmentIds.includes(targetDeptId)) {
            throw new BadRequestException('Your department is not permitted to send internal tickets to the selected department.');
          }
        }

        if (targetDept?.allowedReceiveFromDepartmentIds && targetDept.allowedReceiveFromDepartmentIds.length > 0) {
          if (!targetDept.allowedReceiveFromDepartmentIds.includes(senderDeptId)) {
            throw new BadRequestException('The selected department does not accept internal tickets from your department.');
          }
        }
      }

      const userRule = await tx.userTicketRule.findUnique({ where: { userId: actorId } });

      if (dto.requestedEmployeeId && userRule && !userRule.canDirectAssignOfficer && principal.roleCode !== 'ADMIN') {
        throw new BadRequestException('You are not permitted to directly assign tickets to specific officers.');
      }

      if (dto.targetDepartmentId) {
        const requiredCustomFields = await tx.departmentTicketCustomField.findMany({
          where: { departmentId: dto.targetDepartmentId, isActive: true, isRequired: true },
        });
        for (const field of requiredCustomFields) {
          const val = dto.customFields?.[field.id];
          if (val === undefined || val === null || val === '') {
            throw new BadRequestException(`Field "${field.nameEn}" is required.`);
          }
        }
      }

      const canBypassApproval = (
        userRule?.canSendWithoutManagerApproval === true ||
        principal.roleCode === 'DEPARTMENT_MANGER' ||
        principal.roleCode === 'BRANCH_MANAGER' ||
        principal.roleCode === 'ADMIN' ||
        principal.permissions?.includes('BYPASS_TICKET_APPROVAL')
      );

      const needsApproval = (
        principal.departmentId !== dto.targetDepartmentId && !canBypassApproval
      );

      const ticket = await tx.internalTicket.create({
        data: {
          referenceNumber: refNumber,
          title: dto.title,
          description: dto.description,
          requestedById: actorId,
          targetDepartmentId: dto.targetDepartmentId,
          categoryId: dto.categoryId,
          requestedEmployeeId: dto.requestedEmployeeId || null,
          assignedEmployeeId: (!needsApproval && dto.requestedEmployeeId) ? dto.requestedEmployeeId : null,
          priority: dto.priority || 'NORMAL',
          slaOptionId: dto.slaOptionId || null,
          dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
          customFields: (dto.customFields as any) ?? undefined,
          status: needsApproval ? 'PENDING_APPROVAL' : (dto.requestedEmployeeId ? 'ASSIGNED' : 'NEW'),
        },
      });

      await this.logActivity(tx, ticket.id, actorId, 'CREATED', {
        targetDepartmentId: dto.targetDepartmentId,
      });

      if (dto.attachments?.length) {
        await this.storeTicketAttachments(tx, ticket.id, actorId, dto.attachments);
      }

      return ticket;
    });
  }

  async transfer(ticketId: string, actorId: string, dto: TransferTicketDto) {
    return this.repository.transaction(async (tx) => {
      const ticket = await tx.internalTicket.findUnique({ where: { id: ticketId } });
      if (!ticket) throw new NotFoundException('Ticket not found');

      const userRule = await tx.userTicketRule.findUnique({ where: { userId: actorId } });
      if (userRule && !userRule.canTransferDepartment) {
        throw new BadRequestException('You are not permitted to transfer tickets to other departments.');
      }

      if (dto.targetDepartmentId && ticket.targetDepartmentId !== dto.targetDepartmentId) {
        const fromDeptId = ticket.targetDepartmentId;
        const toDeptId = dto.targetDepartmentId;

        const [fromDept, toDept] = await Promise.all([
          tx.department.findUnique({
            where: { id: fromDeptId },
            select: { allowedSendToDepartmentIds: true },
          }),
          tx.department.findUnique({
            where: { id: toDeptId },
            select: { allowedReceiveFromDepartmentIds: true },
          }),
        ]);

        if (fromDept?.allowedSendToDepartmentIds && fromDept.allowedSendToDepartmentIds.length > 0) {
          if (!fromDept.allowedSendToDepartmentIds.includes(toDeptId)) {
            throw new BadRequestException('Transfer not permitted: current department cannot send tickets to the target department.');
          }
        }

        if (toDept?.allowedReceiveFromDepartmentIds && toDept.allowedReceiveFromDepartmentIds.length > 0) {
          if (!toDept.allowedReceiveFromDepartmentIds.includes(fromDeptId)) {
            throw new BadRequestException('Transfer not permitted: target department cannot receive tickets from the current department.');
          }
        }
      }

      const updated = await tx.internalTicket.update({
        where: { id: ticketId },
        data: {
          targetDepartmentId: dto.targetDepartmentId,
          requestedEmployeeId: dto.requestedEmployeeId || null,
          status: 'NEW',
        },
      });

      await this.logActivity(tx, ticket.id, actorId, 'TRANSFERRED_DEPARTMENT', {
        from: ticket.targetDepartmentId,
        to: dto.targetDepartmentId,
        reason: dto.reason,
      });

      return updated;
    });
  }

  async assign(ticketId: string, managerId: string, dto: AssignTicketDto) {
    return this.repository.transaction(async (tx) => {
      const ticket = await tx.internalTicket.findUnique({ where: { id: ticketId } });
      if (!ticket) throw new NotFoundException('Ticket not found');

      const updated = await tx.internalTicket.update({
        where: { id: ticketId },
        data: {
          assignedEmployeeId: dto.employeeId,
          status: 'ASSIGNED',
        },
      });

      await this.logActivity(tx, ticket.id, managerId, 'ASSIGNED', {
        employeeId: dto.employeeId,
      });

      return updated;
    });
  }

  async assignToTeam(ticketId: string, managerId: string) {
    return this.repository.transaction(async (tx) => {
      const ticket = await tx.internalTicket.findUnique({ where: { id: ticketId } });
      if (!ticket) throw new NotFoundException('Ticket not found');

      const updated = await tx.internalTicket.update({
        where: { id: ticketId },
        data: {
          assignedEmployeeId: null,
          status: 'ASSIGNED',
        },
      });

      await this.logActivity(tx, ticket.id, managerId, 'ASSIGNED_TO_TEAM', {});

      return updated;
    });
  }

  async updateStatus(ticketId: string, actorId: string, status: InternalTicketStatus, details?: any) {
    return this.repository.transaction(async (tx) => {
      const ticket = await tx.internalTicket.findUnique({ where: { id: ticketId } });
      if (!ticket) throw new NotFoundException('Ticket not found');

      const data: any = { status };
      if (status === 'IN_PROGRESS') data.inProgressAt = new Date();
      if (status === 'RESOLVED') data.resolvedAt = new Date();
      if (status === 'CLOSED') data.closedAt = new Date();

      const updated = await tx.internalTicket.update({
        where: { id: ticketId },
        data,
      });

      await this.logActivity(tx, ticket.id, actorId, `STATUS_CHANGED_${status}`, details);

      return updated;
    });
  }

  async wait(ticketId: string, actorId: string, dto: WaitTicketDto) {
    return this.repository.transaction(async (tx) => {
      const ticket = await tx.internalTicket.update({
        where: { id: ticketId },
        data: { 
          status: 'WAITING',
          waitingReasonId: dto.waitingReasonId || null,
          customWaitingReason: dto.customWaitingReason || null,
        }
      });
      await this.logActivity(tx, ticketId, actorId, 'WAITING_FOR_RESPONSE', dto);
      return ticket;
    });
  }

  async resolve(ticketId: string, actorId: string, dto: ResolveTicketDto) {
    return this.repository.transaction(async (tx) => {
      const ticket = await tx.internalTicket.update({
        where: { id: ticketId },
        data: { 
          status: 'RESOLVED', 
          resolvedAt: new Date(),
          resolutionReasonId: dto.resolutionReasonId,
          resolutionDetails: dto.resolutionDetails
        }
      });
      await this.logActivity(tx, ticketId, actorId, 'STATUS_CHANGED_RESOLVED', dto);
      return ticket;
    });
  }

  async reject(ticketId: string, actorId: string, dto: RejectTicketDto, principal?: any) {
    return this.repository.transaction(async (tx) => {
      const existing = await tx.internalTicket.findUnique({
        where: { id: ticketId },
        include: { requestedBy: true },
      });
      if (!existing) throw new NotFoundException('Ticket not found');

      if (principal && principal.roleCode !== 'ADMIN') {
        const isTargetDept = Boolean(principal.departmentId && principal.departmentId === existing.targetDepartmentId);
        const isRequester = Boolean(principal.userId === existing.requestedById || (principal.departmentId && principal.departmentId === existing.requestedBy?.departmentId));
        if (!isTargetDept && !isRequester) {
          throw new AppException('RBAC_FORBIDDEN', 'Only the assigned department manager or requesting manager can reject this resolution', 403);
        }
      }

      const ticket = await tx.internalTicket.update({
        where: { id: ticketId },
        data: { 
          status: 'REJECTED', 
          rejectReasonId: dto.rejectReasonId,
          rejectDetails: dto.rejectDetails || null
        }
      });
      await this.logActivity(tx, ticketId, actorId, 'REJECTED_NEEDS_WORK', dto);
      return ticket;
    });
  }

  async getDepartmentTickets(departmentId: string) {
    return this.repository.findMany({
      where: departmentId === 'ALL' ? {} : { 
        targetDepartmentId: departmentId,
        status: { notIn: [InternalTicketStatus.PENDING_APPROVAL] }
      },
      include: {
        assignedEmployee: true,
        requestedBy: { include: { department: true } },
        targetDepartment: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMyTickets(departmentId: string, userId: string) {
    return this.repository.findMany({
      where: {
        OR: [
          { targetDepartmentId: departmentId, status: { not: 'PENDING_APPROVAL' } },
          { requestedById: userId },
          { assignedEmployeeId: userId },
          { 
             status: 'PENDING_APPROVAL', 
             requestedBy: { departmentId: departmentId } 
          }
        ]
      },
      include: {
        assignedEmployee: true,
        requestedBy: { include: { department: true } },
        targetDepartment: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getFormOptions(principal: any) {
    return this.repository.transaction(async (tx) => {
      const allDepartments = await tx.department.findMany({
        where: { isActive: true },
        select: { id: true, nameEn: true, nameAr: true, allowedSendToDepartmentIds: true, allowedReceiveFromDepartmentIds: true },
      });

      let departments = allDepartments.map((d) => ({
        id: d.id,
        nameEn: d.nameEn,
        nameAr: d.nameAr,
        allowedSendToDepartmentIds: d.allowedSendToDepartmentIds,
        allowedReceiveFromDepartmentIds: d.allowedReceiveFromDepartmentIds,
      }));

      if (principal?.roleCode !== 'ADMIN' && principal?.departmentId) {
        const senderDeptId = principal.departmentId;
        const senderDept = allDepartments.find((d) => d.id === senderDeptId);

        departments = departments.filter((targetDept) => {
          if (senderDept?.allowedSendToDepartmentIds && senderDept.allowedSendToDepartmentIds.length > 0) {
            if (!senderDept.allowedSendToDepartmentIds.includes(targetDept.id)) return false;
          }
          if (targetDept.allowedReceiveFromDepartmentIds && targetDept.allowedReceiveFromDepartmentIds.length > 0) {
            if (!targetDept.allowedReceiveFromDepartmentIds.includes(senderDeptId)) return false;
          }
          return true;
        });
      }

      const categories = await tx.category.findMany({ where: { isActive: true, isInternal: true }, select: { id: true, nameEn: true, nameAr: true, departmentId: true } });
      
      const rawEmployees = await tx.user.findMany({
        where: { isActive: true },
        select: { 
          id: true, 
          nameEn: true, 
          nameAr: true, 
          email: true, 
          phone: true, 
          departmentId: true, 
          role: { select: { code: true } },
          assignedInternalTickets: {
            where: { status: { notIn: ['CLOSED', 'RESOLVED', 'REJECTED'] } },
            select: { id: true }
          }
        }
      });
      
      const employees = rawEmployees.map(emp => ({
        ...emp,
        activeTicketsCount: emp.assignedInternalTickets.length,
        assignedInternalTickets: undefined // remove the raw list from the response payload
      }));
      
      const waitingReasons = await tx.ticketWaitingReason.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } });
      const resolutionReasons = await tx.ticketResolutionReason.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } });
      const rejectReasons = await tx.ticketRejectReason.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } });

      return { departments, categories, employees, waitingReasons, resolutionReasons, rejectReasons };
    });
  }

  async getSettingsReasons(type: string, departmentId: string, principal: any) {
    if (principal.roleCode !== 'ADMIN') throw new BadRequestException('Unauthorized');
    if (!departmentId) return [];
    return this.repository.transaction(async (tx) => {
      const where = { departmentId };
      if (type === 'waiting') return tx.ticketWaitingReason.findMany({ where, orderBy: { createdAt: 'desc' } });
      if (type === 'resolution') return tx.ticketResolutionReason.findMany({ where, orderBy: { createdAt: 'desc' } });
      if (type === 'reject') return tx.ticketRejectReason.findMany({ where, orderBy: { createdAt: 'desc' } });
      return [];
    });
  }

  async createSettingsReason(type: string, dto: any, principal: any) {
    if (principal.roleCode !== 'ADMIN') throw new BadRequestException('Unauthorized');
    if (!dto.departmentId) throw new BadRequestException('departmentId is required');
    return this.repository.transaction(async (tx) => {
      const data = { reasonEn: dto.reasonEn, reasonAr: dto.reasonAr, departmentId: dto.departmentId, order: 0, isActive: true };
      if (type === 'waiting') return tx.ticketWaitingReason.create({ data });
      if (type === 'resolution') return tx.ticketResolutionReason.create({ data });
      if (type === 'reject') return tx.ticketRejectReason.create({ data });
    });
  }

  async updateSettingsReason(type: string, id: string, dto: any, principal: any) {
    if (principal.roleCode !== 'ADMIN') throw new BadRequestException('Unauthorized');
    return this.repository.transaction(async (tx) => {
      const data = { reasonEn: dto.reasonEn, reasonAr: dto.reasonAr };
      if (type === 'waiting') return tx.ticketWaitingReason.update({ where: { id }, data });
      if (type === 'resolution') return tx.ticketResolutionReason.update({ where: { id }, data });
      if (type === 'reject') return tx.ticketRejectReason.update({ where: { id }, data });
    });
  }

  async deleteSettingsReason(type: string, id: string, principal: any) {
    if (principal.roleCode !== 'ADMIN') throw new BadRequestException('Unauthorized');
    return this.repository.transaction(async (tx) => {
      if (type === 'waiting') return tx.ticketWaitingReason.delete({ where: { id } });
      if (type === 'resolution') return tx.ticketResolutionReason.delete({ where: { id } });
      if (type === 'reject') return tx.ticketRejectReason.delete({ where: { id } });
    });
  }

  async getSettingsRouting(departmentId: string, principal: any) {
    if (principal.roleCode !== 'ADMIN' && principal.departmentId !== departmentId) {
      throw new BadRequestException('Unauthorized');
    }
    return this.repository.transaction(async (tx) => {
      const dept = await tx.department.findUnique({
        where: { id: departmentId },
        select: {
          id: true,
          nameEn: true,
          nameAr: true,
          allowedSendToDepartmentIds: true,
          allowedReceiveFromDepartmentIds: true,
        },
      });
      if (!dept) throw new NotFoundException('Department not found');
      return dept;
    });
  }

  async updateSettingsRouting(departmentId: string, dto: any, principal: any) {
    if (principal.roleCode !== 'ADMIN') throw new BadRequestException('Unauthorized');
    return this.repository.transaction(async (tx) => {
      const allowedSendToDepartmentIds = Array.isArray(dto.allowedSendToDepartmentIds)
        ? dto.allowedSendToDepartmentIds.filter((id: unknown): id is string => typeof id === 'string')
        : [];
      const allowedReceiveFromDepartmentIds = Array.isArray(dto.allowedReceiveFromDepartmentIds)
        ? dto.allowedReceiveFromDepartmentIds.filter((id: unknown): id is string => typeof id === 'string')
        : [];

      return tx.department.update({
        where: { id: departmentId },
        data: {
          allowedSendToDepartmentIds,
          allowedReceiveFromDepartmentIds,
        },
        select: {
          id: true,
          nameEn: true,
          nameAr: true,
          allowedSendToDepartmentIds: true,
          allowedReceiveFromDepartmentIds: true,
        },
      });
    });
  }

  async getDepartmentFields(departmentId: string, principal: any) {
    return this.repository.transaction(async (tx) => {
      const [config, customFields] = await Promise.all([
        tx.departmentTicketFormConfig.findUnique({ where: { departmentId } }),
        tx.departmentTicketCustomField.findMany({
          where: { departmentId, ...(principal.roleCode === 'ADMIN' ? {} : { isActive: true }) },
          orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
        }),
      ]);

      return {
        config: config || {
          departmentId,
          enablePriorityField: true,
          enableDueDateField: true,
          enableAttachmentsField: true,
          enableOfficerSelection: true,
        },
        customFields,
      };
    });
  }

  async updateDepartmentFormConfig(departmentId: string, dto: any, principal: any) {
    if (principal.roleCode !== 'ADMIN') throw new BadRequestException('Unauthorized');
    return this.repository.transaction(async (tx) => {
      return tx.departmentTicketFormConfig.upsert({
        where: { departmentId },
        create: {
          departmentId,
          enablePriorityField: dto.enablePriorityField ?? true,
          enableDueDateField: dto.enableDueDateField ?? true,
          enableAttachmentsField: dto.enableAttachmentsField ?? true,
          enableOfficerSelection: dto.enableOfficerSelection ?? true,
        },
        update: {
          enablePriorityField: dto.enablePriorityField ?? true,
          enableDueDateField: dto.enableDueDateField ?? true,
          enableAttachmentsField: dto.enableAttachmentsField ?? true,
          enableOfficerSelection: dto.enableOfficerSelection ?? true,
        },
      });
    });
  }

  async createDepartmentCustomField(departmentId: string, dto: any, principal: any) {
    if (principal.roleCode !== 'ADMIN') throw new BadRequestException('Unauthorized');
    if (!dto.nameEn?.trim() || !dto.nameAr?.trim() || !dto.fieldType) {
      throw new BadRequestException('English name, Arabic name, and field type are required.');
    }
    return this.repository.transaction(async (tx) => {
      const count = await tx.departmentTicketCustomField.count({ where: { departmentId } });
      const options = Array.isArray(dto.options)
        ? dto.options.filter((o: unknown): o is string => typeof o === 'string' && Boolean(o.trim()))
        : [];
      return tx.departmentTicketCustomField.create({
        data: {
          departmentId,
          nameEn: dto.nameEn.trim(),
          nameAr: dto.nameAr.trim(),
          fieldType: dto.fieldType,
          options,
          placeholderEn: dto.placeholderEn?.trim() || null,
          placeholderAr: dto.placeholderAr?.trim() || null,
          isRequired: Boolean(dto.isRequired),
          isActive: dto.isActive !== false,
          order: typeof dto.order === 'number' ? dto.order : count,
        },
      });
    });
  }

  async updateDepartmentCustomField(departmentId: string, fieldId: string, dto: any, principal: any) {
    if (principal.roleCode !== 'ADMIN') throw new BadRequestException('Unauthorized');
    return this.repository.transaction(async (tx) => {
      const field = await tx.departmentTicketCustomField.findFirst({
        where: { id: fieldId, departmentId },
      });
      if (!field) throw new NotFoundException('Field not found');

      const data: any = {};
      if (dto.nameEn !== undefined) data.nameEn = dto.nameEn.trim();
      if (dto.nameAr !== undefined) data.nameAr = dto.nameAr.trim();
      if (dto.fieldType !== undefined) data.fieldType = dto.fieldType;
      if (dto.options !== undefined && Array.isArray(dto.options)) {
        data.options = dto.options.filter((o: unknown): o is string => typeof o === 'string' && Boolean(o.trim()));
      }
      if (dto.placeholderEn !== undefined) data.placeholderEn = dto.placeholderEn?.trim() || null;
      if (dto.placeholderAr !== undefined) data.placeholderAr = dto.placeholderAr?.trim() || null;
      if (dto.isRequired !== undefined) data.isRequired = Boolean(dto.isRequired);
      if (dto.isActive !== undefined) data.isActive = Boolean(dto.isActive);
      if (dto.order !== undefined) data.order = Number(dto.order);

      return tx.departmentTicketCustomField.update({
        where: { id: fieldId },
        data,
      });
    });
  }

  async deleteDepartmentCustomField(departmentId: string, fieldId: string, principal: any) {
    if (principal.roleCode !== 'ADMIN') throw new BadRequestException('Unauthorized');
    return this.repository.transaction(async (tx) => {
      return tx.departmentTicketCustomField.deleteMany({
        where: { id: fieldId, departmentId },
      });
    });
  }

  async getUserTicketRules(userId: string, principal: any) {
    if (principal.roleCode !== 'ADMIN' && principal.userId !== userId) {
      throw new BadRequestException('Unauthorized');
    }
    return this.repository.transaction(async (tx) => {
      const rule = await tx.userTicketRule.findUnique({ where: { userId } });
      if (rule) return rule;
      return {
        userId,
        canSendWithoutManagerApproval: false,
        canDirectAssignOfficer: true,
        canSelfAssign: true,
        canTransferDepartment: true,
        canCloseDirectly: true,
        canReopenTickets: true,
      };
    });
  }

  async updateUserTicketRules(userId: string, dto: any, principal: any) {
    if (principal.roleCode !== 'ADMIN') throw new BadRequestException('Unauthorized');
    return this.repository.transaction(async (tx) => {
      return tx.userTicketRule.upsert({
        where: { userId },
        create: {
          userId,
          canSendWithoutManagerApproval: Boolean(dto.canSendWithoutManagerApproval),
          canDirectAssignOfficer: dto.canDirectAssignOfficer ?? true,
          canSelfAssign: dto.canSelfAssign ?? true,
          canTransferDepartment: dto.canTransferDepartment ?? true,
          canCloseDirectly: dto.canCloseDirectly ?? true,
          canReopenTickets: dto.canReopenTickets ?? true,
        },
        update: {
          canSendWithoutManagerApproval: Boolean(dto.canSendWithoutManagerApproval),
          canDirectAssignOfficer: dto.canDirectAssignOfficer ?? true,
          canSelfAssign: dto.canSelfAssign ?? true,
          canTransferDepartment: dto.canTransferDepartment ?? true,
          canCloseDirectly: dto.canCloseDirectly ?? true,
          canReopenTickets: dto.canReopenTickets ?? true,
        },
      });
    });
  }

  async getAllUsersRules(principal: any) {
    if (principal.roleCode !== 'ADMIN') throw new BadRequestException('Unauthorized');
    return this.repository.transaction(async (tx) => {
      return tx.user.findMany({
        where: { isActive: true },
        select: {
          id: true,
          nameEn: true,
          nameAr: true,
          username: true,
          email: true,
          role: { select: { code: true, nameEn: true, nameAr: true } },
          department: { select: { id: true, nameEn: true, nameAr: true } },
          ticketRule: true,
        },
        orderBy: [{ departmentId: 'asc' }, { nameEn: 'asc' }],
      });
    });
  }

  async getTeamWorkload(principal: any, filters?: { filterType?: string, dateFrom?: string, dateTo?: string, categoryId?: string, severity?: string }) {
    return this.repository.transaction(async (tx) => {
      let userQuery: any = { isActive: true };
      
      if (principal.roleCode === 'BRANCH_MANAGER') {
        userQuery.branchId = principal.branchId;
      } else if (principal.roleCode !== 'ADMIN') {
        userQuery.departmentId = principal.departmentId;
      }

      const employees = await tx.user.findMany({
        where: userQuery,
        select: { 
          id: true, 
          nameEn: true, 
          nameAr: true,
          role: { select: { code: true } },
          department: { select: { nameEn: true, nameAr: true } },
          assignedInternalTickets: { select: { status: true, dueAt: true, resolvedAt: true } },
          employeeTicketRatings: { select: { score: true } }
        }
      });

      // Construct ticket base query
      const baseTicketQuery: any = {};
      
      if (filters?.dateFrom) {
        baseTicketQuery.createdAt = { ...baseTicketQuery.createdAt, gte: new Date(filters.dateFrom) };
      }
      if (filters?.dateTo) {
        // add 1 day to include the entire end date
        const endDate = new Date(filters.dateTo);
        endDate.setDate(endDate.getDate() + 1);
        baseTicketQuery.createdAt = { ...baseTicketQuery.createdAt, lt: endDate };
      }
      if (filters?.categoryId && filters.categoryId !== 'all') {
        baseTicketQuery.categoryId = filters.categoryId;
      }
      if (filters?.severity && filters.severity !== 'all') {
        baseTicketQuery.priority = filters.severity; // Map severity to priority
      }

      // External means spawned from Complaint, usually by referenceNumber starting with 'C-'
      if (filters?.filterType === 'external') {
        baseTicketQuery.referenceNumber = { startsWith: 'C-' };
      } else if (filters?.filterType === 'internal') {
        baseTicketQuery.referenceNumber = { not: { startsWith: 'C-' } };
      }

      const workload = employees.map(emp => {
        const tickets = emp.assignedInternalTickets || [];
        let active = 0;
        let done = 0;
        let onTime = 0;
        let doneWithDue = 0;
        
        tickets.forEach(t => {
          if (t.status === 'CLOSED' || t.status === 'RESOLVED') {
            done++;
            if (t.dueAt) {
              doneWithDue++;
              if (t.resolvedAt && t.resolvedAt <= t.dueAt) onTime++;
            }
          } else if (t.status !== 'REJECTED') {
            active++;
          }
        });

        const onTimeRate = doneWithDue > 0 ? Math.round((onTime / doneWithDue) * 100) : 100;
        const rating = emp.employeeTicketRatings?.length 
          ? emp.employeeTicketRatings.reduce((sum: number, r: any) => sum + r.score, 0) / emp.employeeTicketRatings.length
          : 5.0;

        return {
          id: emp.id,
          name: emp.nameEn,
          nameAr: emp.nameAr,
          role: emp.role?.code || 'STAFF',
          department: emp.department?.nameEn || 'N/A',
          active,
          done,
          rating: Number(rating.toFixed(1)),
          onTimeRate
        };
      });

      return workload.sort((a, b) => b.done - a.done);
    });
  }

  async getEmployeeTickets(employeeId: string, principal: any) {
    return this.repository.findMany({
      where: {
        assignedEmployeeId: employeeId
      },
      include: {
        targetDepartment: true,
        category: true,
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getTicket(ticketId: string, principal?: any) {
    const ticket = await this.repository.findById(ticketId, {
      assignedEmployee: true,
      requestedBy: { include: { department: true } },
      targetDepartment: {
        include: {
          ticketCustomFields: true,
        },
      },
      category: true,
      rating: true,
      activities: {
        include: { actor: true },
        orderBy: { createdAt: 'desc' }
      },
      attachments: true,
      notes: {
        include: { author: true, attachments: true },
        orderBy: { createdAt: 'asc' }
      }
    });
    if (!ticket) throw new NotFoundException('Ticket not found');

    if (principal && principal.roleCode !== 'ADMIN') {
      const isTargetDept = Boolean(principal.departmentId && principal.departmentId === ticket.targetDepartmentId);
      const isRequester = Boolean(principal.userId === ticket.requestedById || (principal.departmentId && principal.departmentId === (ticket as any).requestedBy?.departmentId));
      const isAssigned = Boolean(principal.userId === ticket.assignedEmployeeId);

      if (!isTargetDept && !isRequester && !isAssigned) {
        throw new AppException('RBAC_FORBIDDEN', 'Access to ticket belonging to another department is forbidden', 403);
      }
    }

    return ticket;
  }

  async addNote(ticketId: string, authorId: string, dto: AddNoteDto) {
    return this.repository.transaction(async (tx) => {
      const ticket = await tx.internalTicket.findUnique({ where: { id: ticketId } });
      if (!ticket) throw new NotFoundException('Ticket not found');

      const note = await tx.ticketNote.create({
        data: {
          ticketId,
          authorId,
          content: dto.content,
        }
      });

      if (dto.attachments?.length) {
        await this.storeNoteAttachments(tx, note.id, authorId, dto.attachments);
      }

      await this.logActivity(tx, ticketId, authorId, 'NOTE_ADDED', { noteId: note.id });
      return note;
    });
  }

  async acceptTicket(ticketId: string, employeeId: string) {
    return this.repository.transaction(async (tx) => {
      const ticket = await tx.internalTicket.update({
        where: { id: ticketId },
        data: { 
          status: 'IN_PROGRESS',
          assignedEmployeeId: employeeId,
          inProgressAt: new Date(),
        }
      });

      await this.logActivity(tx, ticketId, employeeId, 'ACCEPTED', {});
      return ticket;
    });
  }

  async transitionStatus(ticketId: string, actorId: string, status: any, action: string, details?: any) {
    return this.repository.transaction(async (tx) => {
      const data: any = { status };
      if (status === 'IN_PROGRESS') data.inProgressAt = new Date();
      if (status === 'RESOLVED') data.resolvedAt = new Date();
      if (status === 'CLOSED') data.closedAt = new Date();

      const ticket = await tx.internalTicket.update({
        where: { id: ticketId },
        data,
      });

      await this.logActivity(tx, ticketId, actorId, action, details);
      return ticket;
    });
  }

  async approve(ticketId: string, managerId: string, dto: any, principal?: any) {
    return this.repository.transaction(async (tx) => {
      const existing = await tx.internalTicket.findUnique({
        where: { id: ticketId },
        include: { requestedBy: true },
      });
      if (!existing) throw new NotFoundException('Ticket not found');

      if (principal && principal.roleCode !== 'ADMIN') {
        const isTargetDept = Boolean(principal.departmentId && principal.departmentId === existing.targetDepartmentId);
        const isRequester = Boolean(principal.userId === existing.requestedById || (principal.departmentId && principal.departmentId === existing.requestedBy?.departmentId));
        if (!isTargetDept && !isRequester) {
          throw new AppException('RBAC_FORBIDDEN', 'Only the assigned department manager or requesting manager can accept this resolution', 403);
        }
      }

      const ticket = await tx.internalTicket.update({
        where: { id: ticketId },
        data: { status: 'CLOSED' }
      });

      if (dto.rating || dto.feedback) {
        await tx.ticketRating.create({
          data: {
            ticketId,
            managerId,
            employeeId: existing.assignedEmployeeId!,
            score: dto.rating || 0,
            comment: dto.feedback || null
          }
        });
      }

      await this.logActivity(tx, ticketId, managerId, 'APPROVED_AND_CLOSED', dto);
      return ticket;
    });
  }

  async approveRequest(ticketId: string, managerId: string) {
    return this.repository.transaction(async (tx) => {
      const ticket = await tx.internalTicket.findUnique({ where: { id: ticketId } });
      if (!ticket) throw new NotFoundException('Ticket not found');
      if (ticket.status !== 'PENDING_APPROVAL') throw new BadRequestException('Ticket is not pending approval');

      let newDueAt = ticket.dueAt;
      if (ticket.dueAt) {
        // Shift the due date forward by the exact amount of time it spent waiting for approval
        const timeSpentPending = Date.now() - ticket.createdAt.getTime();
        newDueAt = new Date(ticket.dueAt.getTime() + timeSpentPending);
      }

      const updated = await tx.internalTicket.update({
        where: { id: ticketId },
        data: {
          status: ticket.requestedEmployeeId ? 'ASSIGNED' : 'NEW',
          assignedEmployeeId: ticket.requestedEmployeeId || null,
          dueAt: newDueAt,
        },
      });

      await this.logActivity(tx, ticketId, managerId, 'APPROVED', { reason: 'Manager approved the request to be sent to target department.' });
      return updated;
    });
  }

  async resubmit(ticketId: string, actorId: string, reason?: string) {
    return this.repository.transaction(async (tx) => {
      const ticket = await tx.internalTicket.findUnique({ where: { id: ticketId } });
      if (!ticket) throw new NotFoundException('Ticket not found');
      if (ticket.status !== 'REJECTED') throw new BadRequestException('Ticket is not rejected');

      const updated = await tx.internalTicket.update({
        where: { id: ticketId },
        data: {
          status: 'PENDING_APPROVAL',
        },
      });

      await this.logActivity(tx, ticketId, actorId, 'STATUS_CHANGED_PENDING_APPROVAL', { reason: reason || 'Requester resubmitted ticket for approval' });
      return updated;
    });
  }

  async deleteTicket(ticketId: string) {
    const ticket = await this.repository.findById(ticketId);
    if (!ticket) throw new NotFoundException('Ticket not found');
    return this.repository.delete(ticketId);
  }

  async getAttachmentFile(ticketId: string, attachmentId: string) {
    const attachment = await this.repository.transaction(async (tx) => {
      return tx.ticketAttachment.findUnique({ where: { id: attachmentId, ticketId } });
    });
    if (!attachment) throw new NotFoundException('Attachment not found');
    const file = await this.attachmentsService.getRawFile(attachment.storageKey);
    return { attachment, file };
  }

  async getNoteAttachmentFile(ticketId: string, noteId: string, attachmentId: string) {
    const attachment = await this.repository.transaction(async (tx) => {
      return tx.ticketNoteAttachment.findUnique({ where: { id: attachmentId, noteId } });
    });
    if (!attachment) throw new NotFoundException('Note attachment not found');
    const note = await this.repository.transaction(async (tx) => {
      return tx.ticketNote.findUnique({ where: { id: noteId, ticketId } });
    });
    if (!note) throw new NotFoundException('Note not found for this ticket');
    const file = await this.attachmentsService.getRawFile(attachment.storageKey);
    return { attachment, file };
  }

  async downloadAttachment(ticketId: string, attachmentId: string) {
    const attachment = await this.repository.transaction(async (tx) => {
      return tx.ticketAttachment.findUnique({ where: { id: attachmentId, ticketId } });
    });
    if (!attachment) throw new NotFoundException('Attachment not found');
    
    let fileName = attachment.fileName || 'attachment.jpg';
    if (!path.extname(fileName)) fileName += '.jpg';

    const token = await this.attachmentsService.prepareDownload(attachment.storageKey);
    return { url: token.token, expiresAt: token.expiresAt, fileName };
  }

  async downloadNoteAttachment(ticketId: string, noteId: string, attachmentId: string) {
    const attachment = await this.repository.transaction(async (tx) => {
      return tx.ticketNoteAttachment.findUnique({ where: { id: attachmentId, noteId } });
    });
    if (!attachment) throw new NotFoundException('Note attachment not found');
    
    const note = await this.repository.transaction(async (tx) => {
      return tx.ticketNote.findUnique({ where: { id: noteId, ticketId } });
    });
    if (!note) throw new NotFoundException('Note not found for this ticket');
    
    let fileName = attachment.fileName || 'attachment.jpg';
    if (!path.extname(fileName)) fileName += '.jpg';

    const token = await this.attachmentsService.prepareDownload(attachment.storageKey);
    return { url: token.token, expiresAt: token.expiresAt, fileName };
  }
}

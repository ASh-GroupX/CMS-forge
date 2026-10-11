import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { InternalTicketsRepository } from './internal-tickets.repository.js';
import { InternalTicketStatus, InternalTicketPriority } from '@prisma/client';
import { CreateInternalTicketDto } from './dto/create-internal-ticket.dto.js';
import { TransferTicketDto, AssignTicketDto, ResolveTicketDto, WaitTicketDto, RejectTicketDto, AddNoteDto } from './dto/update-internal-ticket.dto.js';
import { AttachmentsService } from '../attachments/attachments.service.js';
import { UploadTicketAttachmentDto } from './dto/upload-attachment.dto.js';

@Injectable()
export class InternalTicketsService {
  constructor(
    private readonly repository: InternalTicketsRepository,
    private readonly attachmentsService: AttachmentsService,
  ) {}

  private async storeTicketAttachments(tx: any, ticketId: string, actorId: string, attachments: UploadTicketAttachmentDto[]) {
    for (const attachment of attachments) {
      const stored = await this.attachmentsService.storeObject({
        bytes: Buffer.from(attachment.contentBase64, 'base64'),
        contentType: attachment.contentType,
      });

      await tx.ticketAttachment.create({
        data: {
          ticketId,
          uploadedById: actorId,
          storageKey: stored.storageKey,
          fileName: attachment.fileName,
          contentType: attachment.contentType,
          sizeBytes: attachment.sizeBytes,
        },
      });
    }
  }

  private async storeNoteAttachments(tx: any, noteId: string, actorId: string, attachments: UploadTicketAttachmentDto[]) {
    for (const attachment of attachments) {
      const stored = await this.attachmentsService.storeObject({
        bytes: Buffer.from(attachment.contentBase64, 'base64'),
        contentType: attachment.contentType,
      });

      await tx.ticketNoteAttachment.create({
        data: {
          noteId,
          uploadedById: actorId,
          storageKey: stored.storageKey,
          fileName: attachment.fileName,
          contentType: attachment.contentType,
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
      
      const needsApproval = (
        principal.departmentId !== dto.targetDepartmentId && 
        principal.roleCode !== 'DEPARTMENT_MANGER' && 
        principal.roleCode !== 'BRANCH_MANAGER' && 
        principal.roleCode !== 'ADMIN' &&
        !principal.permissions?.includes('BYPASS_TICKET_APPROVAL')
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

  async reject(ticketId: string, actorId: string, dto: RejectTicketDto) {
    return this.repository.transaction(async (tx) => {
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
      const departments = await tx.department.findMany({ where: { isActive: true }, select: { id: true, nameEn: true, nameAr: true } });
      const categories = await tx.category.findMany({ where: { isActive: true, isInternal: true }, select: { id: true, nameEn: true, nameAr: true, departmentId: true } });
      
      const rawEmployees = await tx.user.findMany({
        where: { isActive: true },
        select: { 
          id: true, 
          nameEn: true, 
          nameAr: true, 
          email: true, 
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

  async getTicket(ticketId: string) {
    const ticket = await this.repository.findById(ticketId, {
      assignedEmployee: true,
      requestedBy: { include: { department: true } },
      targetDepartment: true,
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
          assignedEmployeeId: employeeId
        }
      });

      await this.logActivity(tx, ticketId, employeeId, 'ACCEPTED', {});
      return ticket;
    });
  }

  async transitionStatus(ticketId: string, actorId: string, status: any, action: string, details?: any) {
    return this.repository.transaction(async (tx) => {
      const ticket = await tx.internalTicket.update({
        where: { id: ticketId },
        data: { status }
      });

      await this.logActivity(tx, ticketId, actorId, action, details);
      return ticket;
    });
  }

  async approve(ticketId: string, managerId: string, dto: any) {
    return this.repository.transaction(async (tx) => {
      const ticket = await tx.internalTicket.update({
        where: { id: ticketId },
        data: { status: 'CLOSED' }
      });

      if (dto.rating || dto.feedback) {
        await tx.ticketRating.create({
          data: {
            ticketId,
            managerId,
            employeeId: ticket.assignedEmployeeId!,
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

  async downloadAttachment(ticketId: string, attachmentId: string) {
    const attachment = await this.repository.transaction(async (tx) => {
      return tx.ticketAttachment.findUnique({ where: { id: attachmentId, ticketId } });
    });
    if (!attachment) throw new NotFoundException('Attachment not found');
    
    const token = await this.attachmentsService.prepareDownload(attachment.storageKey);
    return { url: token.token, expiresAt: token.expiresAt, fileName: attachment.fileName };
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
    
    const token = await this.attachmentsService.prepareDownload(attachment.storageKey);
    return { url: token.token, expiresAt: token.expiresAt, fileName: attachment.fileName };
  }
}

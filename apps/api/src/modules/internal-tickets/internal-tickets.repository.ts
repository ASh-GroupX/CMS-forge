import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/http-kernel.js';
import { InternalTicket, Prisma } from '@prisma/client';

@Injectable()
export class InternalTicketsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async exportPage(branchIds: string[] | null, limit: number, cursor?: string) {
    return this.prisma.internalTicket.findMany({
      where: branchIds === null ? {} : { requestedBy: { branchId: { in: branchIds } } },
      orderBy: { id: 'asc' }, take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true, referenceNumber: true, title: true, description: true, status: true,
        priority: true, requestedById: true, targetDepartmentId: true,
        assignedEmployeeId: true, requestedEmployeeId: true, categoryId: true,
        dueAt: true, inProgressAt: true, resolvedAt: true, closedAt: true,
        createdAt: true, updatedAt: true,
        requestedBy: { select: { id: true, nameEn: true, nameAr: true, branchId: true } },
        assignedEmployee: { select: { id: true, nameEn: true, nameAr: true } },
        targetDepartment: { select: { id: true, branchId: true, nameEn: true, nameAr: true } },
        activities: { orderBy: { id: 'asc' }, take: 101, select: {
          id: true, action: true, actorId: true, createdAt: true,
          actor: { select: { id: true, nameEn: true, nameAr: true } },
        } },
      },
    });
  }

  async exportEventsPage(id: string, branchIds: string[] | null, limit: number, cursor?: string) {
    const ticket = await this.prisma.internalTicket.findFirst({
      where: { id, ...(branchIds === null ? {} : { requestedBy: { branchId: { in: branchIds } } }) },
      select: { id: true },
    });
    if (!ticket) return null;
    return this.prisma.ticketActivity.findMany({
      where: { ticketId: id }, orderBy: { id: 'asc' }, take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: { id: true, action: true, actorId: true, createdAt: true,
        actor: { select: { id: true, nameEn: true, nameAr: true } } },
    });
  }

  async exportAcceptances(ticketIds: string[]) {
    return this.prisma.internalTicket.findMany({
      where: { id: { in: ticketIds } }, select: { id: true,
        activities: { where: { action: 'ACCEPTED' },
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }], take: 1,
          select: { createdAt: true, actor: { select: { id: true, nameEn: true, nameAr: true } } } },
      },
    });
  }

  async create(data: Prisma.InternalTicketCreateInput): Promise<InternalTicket> {
    return this.prisma.internalTicket.create({ data });
  }

  async findById(id: string, include?: Prisma.InternalTicketInclude): Promise<InternalTicket | null> {
    return this.prisma.internalTicket.findUnique({
      where: { id },
      include: include || {
        requestedBy: true,
        targetDepartment: true,
        assignedEmployee: true,
        category: true,
        waitingReason: true,
      },
    });
  }

  async findMany(params: {
    where?: Prisma.InternalTicketWhereInput;
    include?: Prisma.InternalTicketInclude;
    orderBy?: Prisma.InternalTicketOrderByWithRelationInput;
  }): Promise<InternalTicket[]> {
    return this.prisma.internalTicket.findMany(params);
  }

  async update(id: string, data: Prisma.InternalTicketUpdateInput): Promise<InternalTicket> {
    return this.prisma.internalTicket.update({
      where: { id },
      data,
    });
  }

  async transaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn);
  }

  async delete(id: string): Promise<InternalTicket> {
    return this.prisma.internalTicket.delete({ where: { id } });
  }
}

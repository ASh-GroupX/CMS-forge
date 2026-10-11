import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/http-kernel.js';
import { InternalTicket, Prisma } from '@prisma/client';

@Injectable()
export class InternalTicketsRepository {
  constructor(private readonly prisma: PrismaService) {}

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

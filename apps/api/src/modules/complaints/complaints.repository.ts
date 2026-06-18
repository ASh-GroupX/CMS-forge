import { Injectable } from '@nestjs/common';
import type {
  ComplaintStatus,
  ComplaintTransitionAction,
  ComplaintTransitionRequestSource,
  Prisma,
  RoleCode,
} from '@prisma/client';
import { PrismaService } from '../../core/http-kernel.js';

type ComplaintTransitionClient = Pick<Prisma.TransactionClient, 'complaint' | 'complaintStatusHistory'>;

export type ComplaintStatusRecord = {
  id: string;
  branchId: string;
  status: ComplaintStatus;
};

export type UpdateComplaintStatusData = {
  complaintId: string;
  toStatus: ComplaintStatus;
};

export type CreateComplaintStatusHistoryData = {
  complaintId: string;
  fromStatus: ComplaintStatus;
  toStatus: ComplaintStatus;
  action: ComplaintTransitionAction;
  actorId?: string | null;
  actorRole: RoleCode;
  requestSource: ComplaintTransitionRequestSource;
  reason?: string | null;
  correlationId?: string | null;
};

@Injectable()
export class ComplaintsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async transaction<T>(work: (client: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(work);
  }

  async updateStatus(
    data: UpdateComplaintStatusData,
    client: ComplaintTransitionClient = this.prisma,
  ): Promise<ComplaintStatusRecord> {
    return client.complaint.update({
      where: { id: data.complaintId },
      data: { status: data.toStatus },
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

import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/http-kernel.js';
import type { ComplaintCaseKpiRow, ComplaintCaseSlaEvent, ComplaintCaseStatusEvent, TaskKpiRow, TaskKpiStatusEvent } from './reports.kpi.js';

export type TaskKpiReadRows = {
  tasks: TaskKpiRow[];
  events: TaskKpiStatusEvent[];
};

export type ComplaintCaseKpiReadRows = {
  records: ComplaintCaseKpiRow[];
  statusEvents: ComplaintCaseStatusEvent[];
  slaEvents: ComplaintCaseSlaEvent[];
};

@Injectable()
export class ReportsRepository {
  constructor(private readonly prisma?: PrismaService) {}

  async listTaskKpiRows(branchId: string | null): Promise<TaskKpiReadRows> {
    if (!this.prisma) throw new Error('ReportsRepository requires PrismaService for task KPI reads');
    const rows = await this.prisma.task.findMany({
      where: taskKpiWhere(branchId),
      select: taskKpiSelect,
    });
    return {
      tasks: rows.map(({ statusHistory: _statusHistory, ...task }) => task),
      events: rows.flatMap((task) => task.statusHistory),
    };
  }

  async listComplaintCaseKpiRows(branchId: string | null): Promise<ComplaintCaseKpiReadRows> {
    if (!this.prisma) throw new Error('ReportsRepository requires PrismaService for complaint/case KPI reads');
    const [complaints, cases] = await Promise.all([
      this.prisma.complaint.findMany({ where: branchWhere(branchId), select: complaintCaseKpiSelect }),
      this.prisma.case.findMany({ where: branchWhere(branchId), select: caseKpiSelect }),
    ]);
    return {
      records: [
        ...complaints.map((complaint) => ({ id: complaint.id, createdAt: complaint.createdAt })),
        ...cases,
      ],
      statusEvents: complaints.flatMap((complaint) => complaint.statusHistory.map((event) => ({ recordId: event.complaintId, toStatus: event.toStatus, action: event.action, createdAt: event.createdAt }))),
      slaEvents: complaints.flatMap((complaint) => complaint.slaEvents.map((event) => ({ recordId: event.complaintId, type: event.type, occurredAt: event.occurredAt }))),
    };
  }
}

const taskKpiSelect = {
  id: true,
  dueAt: true,
  status: true,
  isCustomerPromise: true,
  statusHistory: { select: { taskId: true, toStatus: true, createdAt: true } },
} satisfies Prisma.TaskSelect;

function taskKpiWhere(branchId: string | null): Prisma.TaskWhereInput {
  return branchId
    ? { OR: [{ owner: { branchId } }, { assignee: { branchId } }, { nextActionWho: { branchId } }] }
    : {};
}

const complaintCaseKpiSelect = {
  id: true,
  createdAt: true,
  statusHistory: { select: { complaintId: true, toStatus: true, action: true, createdAt: true } },
  slaEvents: { select: { complaintId: true, type: true, occurredAt: true } },
} satisfies Prisma.ComplaintSelect;

const caseKpiSelect = {
  id: true,
  createdAt: true,
} satisfies Prisma.CaseSelect;

function branchWhere(branchId: string | null): { branchId?: string } {
  return branchId ? { branchId } : {};
}

import { BoardScope, ComplaintStatus, PrismaClient, TaskStatus } from '@prisma/client';

// Default Kanban board stages (docs/CMSS_REVAMP_PLAN.md A1 + B1).
// Idempotent upserts keyed by stable stage codes — safe to run repeatedly.
// Tasks with stageId=null fall back to the default stage mapped to their TaskStatus.
// TICKETS stages are mapped columns over the complaint state machine, one per
// ComplaintStatus in workflow order — drags fire the real transition endpoint.

const DEFAULT_TASK_STAGES: {
  code: string;
  nameEn: string;
  nameAr: string;
  color: string;
  position: number;
  mappedTaskStatus: TaskStatus;
}[] = [
  {
    code: 'TASKS_OPEN',
    nameEn: 'Open',
    nameAr: 'مفتوحة',
    color: 'slate',
    position: 0,
    mappedTaskStatus: TaskStatus.OPEN,
  },
  {
    code: 'TASKS_IN_PROGRESS',
    nameEn: 'In Progress',
    nameAr: 'قيد التنفيذ',
    color: 'blue',
    position: 1,
    mappedTaskStatus: TaskStatus.IN_PROGRESS,
  },
  {
    code: 'TASKS_WAITING',
    nameEn: 'Waiting',
    nameAr: 'في الانتظار',
    color: 'amber',
    position: 2,
    mappedTaskStatus: TaskStatus.WAITING,
  },
  {
    code: 'TASKS_DONE',
    nameEn: 'Done',
    nameAr: 'منجزة',
    color: 'green',
    position: 3,
    mappedTaskStatus: TaskStatus.DONE,
  },
];

const DEFAULT_TICKET_STAGES: {
  code: string;
  nameEn: string;
  nameAr: string;
  color: string;
  position: number;
  mappedComplaintStatus: ComplaintStatus;
}[] = [
  { code: 'TICKETS_DRAFT', nameEn: 'Draft', nameAr: 'مسودة', color: 'slate', position: 0, mappedComplaintStatus: ComplaintStatus.DRAFT },
  { code: 'TICKETS_SUBMITTED', nameEn: 'Submitted', nameAr: 'مقدمة', color: 'blue', position: 1, mappedComplaintStatus: ComplaintStatus.SUBMITTED },
  { code: 'TICKETS_MANAGER_REVIEW', nameEn: 'Manager review', nameAr: 'مراجعة المدير', color: 'violet', position: 2, mappedComplaintStatus: ComplaintStatus.MANAGER_REVIEW },
  { code: 'TICKETS_BRANCH_REVIEW', nameEn: 'Branch review', nameAr: 'مراجعة الفرع', color: 'violet', position: 3, mappedComplaintStatus: ComplaintStatus.BRANCH_REVIEW },
  { code: 'TICKETS_IN_PROGRESS', nameEn: 'In progress', nameAr: 'قيد المعالجة', color: 'amber', position: 4, mappedComplaintStatus: ComplaintStatus.IN_PROGRESS },
  { code: 'TICKETS_RESOLVED', nameEn: 'Resolved', nameAr: 'تم الحل', color: 'green', position: 5, mappedComplaintStatus: ComplaintStatus.RESOLVED },
  { code: 'TICKETS_CLOSED', nameEn: 'Closed', nameAr: 'مغلقة', color: 'slate', position: 6, mappedComplaintStatus: ComplaintStatus.CLOSED },
  { code: 'TICKETS_REOPENED', nameEn: 'Reopened', nameAr: 'أعيد فتحها', color: 'red', position: 7, mappedComplaintStatus: ComplaintStatus.REOPENED },
  { code: 'TICKETS_REJECTED', nameEn: 'Rejected', nameAr: 'مرفوضة', color: 'red', position: 8, mappedComplaintStatus: ComplaintStatus.REJECTED },
];

export async function seedBoardStages(prisma: PrismaClient): Promise<void> {
  for (const stage of DEFAULT_TASK_STAGES) {
    await prisma.boardStage.upsert({
      where: { code: stage.code },
      update: {
        mappedTaskStatus: stage.mappedTaskStatus,
        isDefault: true,
      },
      create: {
        code: stage.code,
        scope: BoardScope.TASKS,
        nameEn: stage.nameEn,
        nameAr: stage.nameAr,
        color: stage.color,
        position: stage.position,
        isDefault: true,
        mappedTaskStatus: stage.mappedTaskStatus,
      },
    });
  }
  for (const stage of DEFAULT_TICKET_STAGES) {
    await prisma.boardStage.upsert({
      where: { code: stage.code },
      update: {
        mappedComplaintStatus: stage.mappedComplaintStatus,
        isDefault: true,
      },
      create: {
        code: stage.code,
        scope: BoardScope.TICKETS,
        nameEn: stage.nameEn,
        nameAr: stage.nameAr,
        color: stage.color,
        position: stage.position,
        isDefault: true,
        mappedComplaintStatus: stage.mappedComplaintStatus,
      },
    });
  }
}

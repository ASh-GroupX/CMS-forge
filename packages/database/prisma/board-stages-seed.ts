import { BoardScope, PrismaClient, TaskStatus } from '@prisma/client';

// Default Kanban board stages for the CMSS task board (docs/CMSS_REVAMP_PLAN.md A1).
// Idempotent upserts keyed by stable stage codes — safe to run repeatedly.
// Tasks with stageId=null fall back to the default stage mapped to their TaskStatus.

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
}

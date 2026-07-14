import type { BoardScope, ComplaintStatus, TaskStatus } from '@prisma/client';

export type BoardStageAdminDto = {
  id: string;
  code: string;
  scope: BoardScope;
  nameEn: string;
  nameAr: string;
  color: string;
  position: number;
  isDefault: boolean;
  mappedTaskStatus: TaskStatus | null;
  mappedComplaintStatus: ComplaintStatus | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

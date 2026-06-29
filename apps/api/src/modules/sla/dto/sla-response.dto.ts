import type { ComplaintSeverity, SlaStage } from '@prisma/client';

export class SlaResponseDto {}

export type SlaPolicyResponseDto = {
  id: string;
  severity: ComplaintSeverity;
  stage: SlaStage;
  branchId: string | null;
  departmentId: string | null;
  categoryId: string | null;
  escalationLevel1: string;
  escalationLevel2: string | null;
  escalationLevel3: string | null;
  escalationLevel2AfterBreachMinutes: number | null;
  escalationLevel3AfterBreachMinutes: number | null;
};

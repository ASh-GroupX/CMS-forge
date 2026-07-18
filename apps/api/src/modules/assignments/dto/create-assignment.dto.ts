export type SetAssignmentInput = {
  entityType: string;
  entityId: string;
  assignedUserId?: string | null;
  assignedDepartmentId?: string | null;
  scopeBranchId?: string | null;
  reason?: string | null;
};

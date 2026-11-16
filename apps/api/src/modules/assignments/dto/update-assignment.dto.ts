export type AssignmentActor = {
  userId: string;
  roleCode: string;
  branchId: string | null;
  departmentId?: string | null;
  permissions?: string[];
};
export type AssignmentAuditContext = {
  correlationId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

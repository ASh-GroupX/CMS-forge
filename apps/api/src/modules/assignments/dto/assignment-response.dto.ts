export type AssignmentResponseDto = {
  id: string;
  entityType: string;
  entityId: string;
  assignedUserId: string | null;
  assignedUserName: string | null;
  assignedUserNameAr: string | null;
  assignedDepartmentId: string | null;
  assignedDepartmentName: string | null;
  assignedDepartmentNameAr: string | null;
  scopeBranchId: string | null;
  assignedById: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
};
export type AssignmentOptionDto = {
  id: string;
  nameEn: string;
  nameAr: string;
  branchId: string | null;
};

export type AssignmentUserOptionDto = AssignmentOptionDto & {
  departmentId: string | null;
  roleCode: string;
};

export type AssignmentOptionsResponseDto = {
  users: AssignmentUserOptionDto[];
  departments: AssignmentOptionDto[];
};

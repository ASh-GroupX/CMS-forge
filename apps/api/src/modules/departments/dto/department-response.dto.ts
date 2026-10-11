export type DepartmentResponseDto = {
  id: string;
  code: string;
  nameEn: string;
  nameAr: string;
  branchId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateStandardProblemDto = {
  titleEn: string;
  titleAr: string;
  categoryId: string;
};

export type UpdateStandardProblemDto = {
  titleEn?: string;
  titleAr?: string;
  isActive?: boolean;
};

export type StandardProblemDto = {
  id: string;
  departmentId: string;
  categoryId: string;
  titleEn: string;
  titleAr: string;
  isActive: boolean;
};

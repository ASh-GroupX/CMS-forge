import type { DataSource } from '@prisma/client';

export type CustomerResponseDto = {
  id: string;
  nameEn: string;
  nameAr: string;
  phone: string;
  email: string | null;
  dmsCode: string | null;
  dataSource: DataSource;
};

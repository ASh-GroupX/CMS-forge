import type { Prisma } from '@prisma/client';
import type { ComplaintReportFilter } from './complaints.repository.js';

export function reportWhere(filter: ComplaintReportFilter): Prisma.ComplaintWhereInput {
  const where: Prisma.ComplaintWhereInput = {
    AND: [],
    ...(filter.referenceNumber ? { referenceNumber: { contains: filter.referenceNumber, mode: 'insensitive' } } : {}),
    ...(filter.customer ? { customer: { OR: customerSearch(filter.customer) } } : {}),
    ...(filter.status ? { status: filter.status } : {}),
    ...(filter.categoryId ? { categoryId: filter.categoryId } : {}),
    ...(filter.departmentId ? { departmentId: filter.departmentId } : {}),
    ...(filter.severity ? { severity: filter.severity } : {}),
    ...(filter.ownerUnassigned ? { ownerId: null, departmentId: null } : filter.ownerId ? { ownerId: filter.ownerId } : {}),
    ...dateRange(filter),
  };

  if (filter.permissions?.includes('COMPLAINT_VIEW_ALL')) {
    if (filter.branchId) (where.AND as any[]).push({ branchId: filter.branchId });
    if (filter.role !== 'CR_MANAGER' && filter.role !== 'ADMIN' && filter.userId) {
      (where.AND as any[]).push({ OR: [{ departmentId: null }, { department: { code: { not: 'IT' } } }, { ownerId: filter.userId }, { createdById: filter.userId }] });
    }
  } else if (filter.permissions?.includes('COMPLAINT_VIEW_BRANCH')) {
    if (filter.branchId) (where.AND as any[]).push({ branchId: filter.branchId });
    if (filter.role !== 'CR_MANAGER' && filter.role !== 'ADMIN' && filter.userId) {
      (where.AND as any[]).push({ OR: [{ departmentId: null }, { department: { code: { not: 'IT' } } }, { ownerId: filter.userId }, { createdById: filter.userId }] });
    }
  } else if (filter.userId && !filter.ownerId && !filter.ownerUnassigned) {
    const isManager = filter.permissions?.includes('COMPLAINT_MANAGE') || filter.permissions?.includes('COMPLAINT_ASSIGN') || filter.permissions?.includes('COMPLAINT_RESOLVE');
    const orConditions: Prisma.ComplaintWhereInput[] = [
      { ownerId: filter.userId },
      { createdById: filter.userId }
    ];
    if (isManager && filter.userDepartmentId) {
      orConditions.push({ departmentId: filter.userDepartmentId });
    }
    (where.AND as any[]).push({ OR: orConditions });
  }

  if ((where.AND as any[]).length === 0) {
    delete where.AND;
  }

  return where;
}

function customerSearch(value: string): Prisma.CustomerWhereInput[] {
  return ['nameEn', 'nameAr', 'phone', 'dmsCode'].map((field) => ({ [field]: { contains: value, mode: 'insensitive' } }));
}

function dateRange(filter: ComplaintReportFilter): Pick<Prisma.ComplaintWhereInput, 'createdAt'> {
  const range = {
    ...(filter.dateFrom ? { gte: new Date(filter.dateFrom) } : {}),
    ...(filter.dateTo ? { lte: new Date(filter.dateTo) } : {}),
  };
  return Object.keys(range).length ? { createdAt: range } : {};
}

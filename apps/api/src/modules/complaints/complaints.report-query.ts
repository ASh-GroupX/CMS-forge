import type { Prisma } from '@prisma/client';
import type { ComplaintReportFilter } from './complaints.repository.js';

export function reportWhere(filter: ComplaintReportFilter): Prisma.ComplaintWhereInput {
  return {
    ...(filter.branchId ? { branchId: filter.branchId } : {}),
    ...(filter.referenceNumber ? { referenceNumber: { contains: filter.referenceNumber, mode: 'insensitive' } } : {}),
    ...(filter.customer ? { customer: { OR: customerSearch(filter.customer) } } : {}),
    ...(filter.status ? { status: filter.status } : {}),
    ...(filter.categoryId ? { categoryId: filter.categoryId } : {}),
    ...(filter.departmentId ? { departmentId: filter.departmentId } : {}),
    ...(filter.severity ? { severity: filter.severity } : {}),
    ...(filter.ownerUnassigned ? { ownerId: null } : filter.ownerId ? { ownerId: filter.ownerId } : {}),
    ...dateRange(filter),
  };
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

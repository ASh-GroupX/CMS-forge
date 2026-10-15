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

  const isGlobalManager = filter.role === 'CR_MANAGER' || filter.role === 'ADMIN' || filter.permissions?.includes('COMPLAINT_VIEW_ALL');
  const isBranchManager = filter.role === 'BRANCH_MANAGER';

  if (isGlobalManager) {
    if (filter.branchId) (where.AND as any[]).push({ branchId: filter.branchId });
  } else if (isBranchManager) {
    if (filter.branchId) (where.AND as any[]).push({ branchId: filter.branchId });
  } else if (filter.userId) {
    // Non-manager officer: strictly scoped to assigned or created
    if (filter.branchId) (where.AND as any[]).push({ branchId: filter.branchId });
    if (!filter.direction && !filter.ownerId && !filter.ownerUnassigned) {
      (where.AND as any[]).push({
        OR: [
          { ownerId: filter.userId },
          { backupOfficerId: filter.userId },
          { collaboratorId: filter.userId },
          { createdById: filter.userId },
        ],
      });
    }
  }

  // Direction filter
  if (filter.direction === 'SENT' && filter.userId) {
    (where.AND as any[]).push({ createdById: filter.userId });
  } else if (filter.direction === 'RECEIVED' && filter.userId) {
    const receivedOr: Prisma.ComplaintWhereInput[] = [
      { ownerId: filter.userId },
      { backupOfficerId: filter.userId },
      { collaboratorId: filter.userId },
    ];
    if (filter.userDepartmentId) {
      receivedOr.push({ departmentId: filter.userDepartmentId });
    }
    (where.AND as any[]).push({ OR: receivedOr });
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

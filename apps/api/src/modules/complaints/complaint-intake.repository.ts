import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/http-kernel.js';

const portalOrigin = { statusHistory: { some: { requestSource: 'CUSTOMER_PORTAL' as const, fromStatus: null, action: 'SUBMIT' as const } } };
const select = { id: true, referenceNumber: true, branchId: true, categoryId: true, departmentId: true, ownerId: true, status: true, severity: true, descriptionEn: true, incidentAt: true, odometer: true, updatedAt: true, createdAt: true, customerNameSnapshot: true, vehicleVinSnapshot: true, vehicleMakeSnapshot: true, vehicleModelSnapshot: true, customer: { select: { nameEn: true, phone: true } }, vehicle: { select: { vin: true, makeEn: true, modelEn: true } } } satisfies Prisma.ComplaintSelect;
export type IntakeRecord = Prisma.ComplaintGetPayload<{ select: typeof select }>;
@Injectable()
export class ComplaintIntakeRepository {
  constructor(private readonly prisma: PrismaService) {}
  transaction<T>(work: (tx: Prisma.TransactionClient) => Promise<T>) { return this.prisma.$transaction(work); }
  async queue(branchId: string | null, ids: string[] | null, exclude: boolean, page: number) {
    const rows = await this.prisma.complaint.findMany({ where: { ...portalOrigin, status: 'SUBMITTED', ...(branchId ? { branchId } : {}), ...(ids ? { id: exclude ? { notIn: ids } : { in: ids } } : {}) }, select, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }], take: 51, skip: (page - 1) * 50 });
    return rows;
  }
  async find(id: string, tx: Prisma.TransactionClient) {
    await tx.$queryRaw`SELECT id FROM complaints WHERE id = ${id} FOR UPDATE`;
    return tx.complaint.findFirst({ where: { id, ...portalOrigin }, select });
  }
  async bump(row: IntakeRecord, data: Prisma.ComplaintUncheckedUpdateInput, tx: Prisma.TransactionClient) {
    return tx.complaint.update({ where: { id: row.id }, data: { ...data, updatedAt: new Date(Math.max(Date.now(), row.updatedAt.getTime() + 1)) }, select });
  }
  history(data: Prisma.ComplaintStatusHistoryUncheckedCreateInput, tx: Prisma.TransactionClient) { return tx.complaintStatusHistory.create({ data }); }
}

import { HttpStatus } from '@nestjs/common';
import { AppException } from '../../core/http-kernel.js';
import type { ComplaintsRepository } from './complaints.repository.js';

export async function exportComplaintPage(repository: ComplaintsRepository, branchIds: string[] | null, limit: number, cursor?: string) {
  const rows = await repository.exportPage(branchIds, limit, cursor);
  const acceptances = await repository.exportAcceptances(rows.slice(0, limit).map((row) => row.id));
  const acceptedById = new Map(acceptances.map((record) => [record.id, record.statusHistory[0]]));
  const items = rows.slice(0, limit).map((row) => ({ ...row,
    statusHistory: row.statusHistory.slice(0, 100), statusHistoryHasMore: row.statusHistory.length > 100,
    acceptedBy: acceptedById.get(row.id)?.actor ?? null,
    acceptedAt: acceptedById.get(row.id)?.createdAt ?? null }));
  return { items, nextCursor: rows.length > limit ? items.at(-1)?.id ?? null : null };
}

export async function exportPortalComplaintCustomerPage(repository: ComplaintsRepository, branchIds: string[] | null, limit: number, cursor?: string) {
  const rows = await repository.exportPortalCustomerPage(branchIds, limit, cursor);
  const items = rows.slice(0, limit).map(({ customer, vehicle, vehicleMakeSnapshot, vehicleModelSnapshot, vehicleVinSnapshot, customerNameSnapshot, ...row }) => ({
    ...row, customerName: customerNameSnapshot ?? customer.nameEn, customerPhone: customer.phone.startsWith('DMS-PORTAL-') ? null : customer.phone,
    vehicleVin: vehicleVinSnapshot ?? vehicle?.vin ?? null, vehicleMake: vehicleMakeSnapshot ?? vehicle?.makeEn ?? null,
    vehicleModel: vehicleModelSnapshot ?? vehicle?.modelEn ?? null,
  }));
  return { items, nextCursor: rows.length > limit ? items.at(-1)?.id ?? null : null };
}

export async function exportComplaintEventsPage(repository: ComplaintsRepository, id: string, branchIds: string[] | null, limit: number, cursor?: string) {
  const rows = await repository.exportEventsPage(id, branchIds, limit, cursor);
  if (!rows) throw new AppException('COMPLAINT_NOT_FOUND', 'Complaint not found', HttpStatus.NOT_FOUND);
  const items = rows.slice(0, limit);
  return { items, nextCursor: rows.length > limit ? items.at(-1)?.id ?? null : null };
}

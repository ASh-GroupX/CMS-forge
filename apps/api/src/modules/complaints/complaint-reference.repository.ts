import type { Prisma } from '@prisma/client';
import type { CreateComplaintData } from './complaints.repository.js';

export type ComplaintReferenceClient = Pick<Prisma.TransactionClient, 'branch' | 'complaintReferenceSequence' | 'vehicle'>;

export async function nextReferenceNumber(branchId: string, at: Date, client: ComplaintReferenceClient): Promise<string> {
  const branch = await client.branch.findUniqueOrThrow({ where: { id: branchId }, select: { code: true } });
  const year = at.getUTCFullYear();
  const sequence = await client.complaintReferenceSequence.upsert({
    where: { branchId_year: { branchId, year } },
    create: { branchId, year, nextSequence: 2 },
    update: { nextSequence: { increment: 1 } },
    select: { nextSequence: true },
  });
  return `CMS-${year}-${branch.code.toUpperCase()}-${String(sequence.nextSequence - 1).padStart(6, '0')}`;
}

export async function upsertVehicle(data: CreateComplaintData, customerId: string, client: ComplaintReferenceClient): Promise<string | null> {
  if (!data.vehicleVin) return null;
  const vehicle = await client.vehicle.upsert({
    where: { vin: data.vehicleVin },
    update: {
      customerId,
      ...(data.vehiclePlate ? { plate: data.vehiclePlate } : {}),
      ...(data.vehicleBrand ? { makeEn: data.vehicleBrand } : {}),
      ...(data.vehicleModel ? { modelEn: data.vehicleModel } : {}),
      ...(data.vehicleModelYear ? { year: data.vehicleModelYear } : {}),
    },
    create: {
      vin: data.vehicleVin,
      plate: data.vehiclePlate ?? 'UNKNOWN',
      makeEn: data.vehicleBrand ?? 'UNKNOWN',
      modelEn: data.vehicleModel ?? 'UNKNOWN',
      year: data.vehicleModelYear ?? 0,
      customerId,
    },
    select: { id: true },
  });
  return vehicle.id;
}

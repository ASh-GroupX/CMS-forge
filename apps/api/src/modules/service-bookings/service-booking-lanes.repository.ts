import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/http-kernel.js';

@Injectable()
export class ServiceBookingLanesRepository {
  constructor(private readonly prisma: PrismaService) {}

  transaction<T>(work: (client: Prisma.TransactionClient) => Promise<T>) {
    return this.prisma.$transaction(work);
  }

  list(serviceCenterId: string, activeOnly: boolean) {
    return this.prisma.serviceBookingLane.findMany({
      where: { serviceCenterId, ...(activeOnly ? { isActive: true } : {}) },
      orderBy: [{ position: 'asc' }, { nameEn: 'asc' }],
    });
  }

  findCenter(serviceCenterId: string, client: Prisma.TransactionClient = this.prisma) {
    return client.serviceCenter.findUnique({ where: { id: serviceCenterId } });
  }

  findLane(id: string, client: Prisma.TransactionClient = this.prisma) {
    return client.serviceBookingLane.findUnique({ where: { id } });
  }

  create(data: Prisma.ServiceBookingLaneUncheckedCreateInput, client: Prisma.TransactionClient) {
    return client.serviceBookingLane.create({ data });
  }

  async update(id: string, expectedUpdatedAt: Date, data: Prisma.ServiceBookingLaneUncheckedUpdateInput, client: Prisma.TransactionClient) {
    const result = await client.serviceBookingLane.updateMany({
      where: { id, updatedAt: expectedUpdatedAt },
      data,
    });
    return result.count === 1 ? client.serviceBookingLane.findUnique({ where: { id } }) : null;
  }
}

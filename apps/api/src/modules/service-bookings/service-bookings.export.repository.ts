import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/http-kernel.js';

@Injectable()
export class ServiceBookingsExportRepository {
  constructor(private readonly prisma: PrismaService) {}

  async page(branchIds: string[] | null, limit: number, cursor?: string) {
    return this.prisma.serviceAppointment.findMany({
      where: branchIds === null ? {} : { branchId: { in: branchIds } },
      orderBy: { id: 'asc' }, take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: { id: true, referenceNumber: true, branchId: true, serviceCenterId: true,
        customerName: true, vin: true, carModelName: true,
        maintenanceTypeName: true, date: true, startTime: true, endTime: true,
        durationMinutes: true, status: true, createdAt: true, updatedAt: true },
    });
  }
}

import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/http-kernel.js';

@Injectable()
export class ServiceBookingClosuresRepository {
  constructor(private readonly prisma: PrismaService) {}

  transaction<T>(work: (client: Prisma.TransactionClient) => Promise<T>) {
    return this.prisma.$transaction(work);
  }

  findCenter(serviceCenterId: string, client: Prisma.TransactionClient = this.prisma) {
    return client.serviceCenter.findUnique({ where: { id: serviceCenterId } });
  }

  list(serviceCenterId: string) {
    return this.prisma.serviceBookingClosure.findMany({
      where: { serviceCenterId }, orderBy: [{ startDate: 'asc' }, { createdAt: 'asc' }],
    });
  }

  findActive(serviceCenterId: string, date: Date) {
    return this.prisma.serviceBookingClosure.findFirst({
      where: { serviceCenterId, startDate: { lte: date }, endDate: { gte: date } },
    });
  }

  findOverlap(serviceCenterId: string, startDate: Date, endDate: Date, client: Prisma.TransactionClient) {
    return client.serviceBookingClosure.findFirst({
      where: { serviceCenterId, startDate: { lte: endDate }, endDate: { gte: startDate } },
    });
  }

  findById(id: string, client: Prisma.TransactionClient = this.prisma) {
    return client.serviceBookingClosure.findUnique({ where: { id } });
  }

  create(data: Prisma.ServiceBookingClosureUncheckedCreateInput, client: Prisma.TransactionClient) {
    return client.serviceBookingClosure.create({ data });
  }

  delete(id: string, client: Prisma.TransactionClient) {
    return client.serviceBookingClosure.delete({ where: { id } });
  }
}

import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/http-kernel.js';

@Injectable()
export class ServiceBookingSmsSettingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async read() {
    return this.prisma.serviceBookingSmsSetting.upsert({
      where: { id: 'global' }, create: { id: 'global' }, update: {},
    });
  }

  transaction<T>(work: (client: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(work);
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/http-kernel.js';
import type { Prisma, Customer } from '@prisma/client';

export type CustomerSearchRecord = Pick<Customer, 'id' | 'nameEn' | 'nameAr' | 'phone' | 'email' | 'dmsCode' | 'dataSource'>;

@Injectable()
export class CustomersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async exportPage(branchIds: string[] | null, limit: number, cursor?: string) {
    const where: Prisma.CustomerWhereInput = branchIds === null ? {} : { complaints: { some: { branchId: { in: branchIds } } } };
    return this.prisma.customer.findMany({
      where, orderBy: { id: 'asc' }, take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: { id: true, nameEn: true, nameAr: true, phone: true, email: true, dataSource: true, createdAt: true, updatedAt: true },
    });
  }

  async search(query: string, limit = 20): Promise<CustomerSearchRecord[]> {
    return this.prisma.customer.findMany({
      where: query ? {
        OR: [
          { phone: { contains: query } },
          { nameEn: { contains: query } },
          { nameAr: { contains: query } },
          { dmsCode: { equals: query } }
        ]
      } : {},
      take: limit,
      select: { id: true, nameEn: true, nameAr: true, phone: true, email: true, dmsCode: true, dataSource: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findById(id: string): Promise<CustomerSearchRecord | null> {
    return this.prisma.customer.findUnique({
      where: { id },
      select: { id: true, nameEn: true, nameAr: true, phone: true, email: true, dmsCode: true, dataSource: true }
    });
  }
}

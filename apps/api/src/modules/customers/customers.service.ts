import { Injectable, NotFoundException } from '@nestjs/common';
import { CustomersRepository, type CustomerSearchRecord } from './customers.repository.js';
import type { CustomerResponseDto } from './dto/customer-response.dto.js';

@Injectable()
export class CustomersService {
  constructor(private readonly repository: CustomersRepository) {}

  async exportPage(branchIds: string[] | null, limit: number, cursor?: string) {
    const rows = await this.repository.exportPage(branchIds, limit, cursor);
    const items = rows.slice(0, limit);
    return { items, nextCursor: rows.length > limit ? items.at(-1)?.id ?? null : null };
  }

  async search(query: string): Promise<CustomerResponseDto[]> {
    const customers = await this.repository.search(query);
    return customers.map(this.mapToDto);
  }

  async findOne(id: string): Promise<CustomerResponseDto> {
    const customer = await this.repository.findById(id);
    if (!customer) throw new NotFoundException('Customer not found');
    return this.mapToDto(customer);
  }

  private mapToDto(customer: CustomerSearchRecord): CustomerResponseDto {
    return {
      id: customer.id,
      nameEn: customer.nameEn,
      nameAr: customer.nameAr,
      phone: customer.phone,
      email: customer.email,
      dmsCode: customer.dmsCode,
      dataSource: customer.dataSource,
    };
  }
}

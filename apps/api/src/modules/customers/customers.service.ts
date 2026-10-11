import { Injectable, NotFoundException } from '@nestjs/common';
import { CustomersRepository, type CustomerSearchRecord } from './customers.repository.js';
import type { CustomerResponseDto } from './dto/customer-response.dto.js';

@Injectable()
export class CustomersService {
  constructor(private readonly repository: CustomersRepository) {}

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

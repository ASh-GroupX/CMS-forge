import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { PermissionGuard, Permissions, SessionAuthGuard } from '../../core/auth.guard.js';
import { CustomersService } from './customers.service.js';
import type { CustomerResponseDto } from './dto/customer-response.dto.js';

@Controller('customers')
export class CustomersController {
  constructor(private readonly service: CustomersService) {}

  @Get('search')
  @UseGuards(SessionAuthGuard, PermissionGuard)
  @Permissions('COMPLAINT_READ')
  async search(@Query('q') q?: string): Promise<{ items: CustomerResponseDto[] }> {
    return { items: await this.service.search(q ?? '') };
  }

  @Get(':id')
  @UseGuards(SessionAuthGuard, PermissionGuard)
  @Permissions('COMPLAINT_READ')
  async findOne(@Param('id') id: string): Promise<{ customer: CustomerResponseDto }> {
    return { customer: await this.service.findOne(id) };
  }
}

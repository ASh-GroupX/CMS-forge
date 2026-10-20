import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ComplaintSettingsService } from './complaint-settings.service.js';
import { SessionAuthGuard } from '../../core/auth.guard.js';

@Controller('complaints/settings')
@UseGuards(SessionAuthGuard)
export class ComplaintSettingsController {
  constructor(private readonly settingsService: ComplaintSettingsService) {}

  @Get('root-causes')
  async listRootCauses(@Query('complaintType') complaintType?: string) {
    return this.settingsService.listRootCauses(complaintType);
  }

  @Post('root-causes')
  async createRootCause(@Body() body: any) {
    return this.settingsService.createRootCause({
      nameEn: body.nameEn,
      nameAr: body.nameAr,
      complaintType: body.complaintType ?? null,
      order: typeof body.order === 'number' ? body.order : 0,
      isActive: body.isActive !== false,
    });
  }

  @Put('root-causes/:id')
  async updateRootCause(@Param('id') id: string, @Body() body: any) {
    return this.settingsService.updateRootCause(id, {
      nameEn: body.nameEn,
      nameAr: body.nameAr,
      complaintType: body.complaintType !== undefined ? (body.complaintType ?? null) : undefined,
      order: typeof body.order === 'number' ? body.order : undefined,
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : undefined,
    });
  }

  @Delete('root-causes/:id')
  async deleteRootCause(@Param('id') id: string) {
    return this.settingsService.deleteRootCause(id);
  }

  @Get('sales-advisors')
  async listSalesAdvisors() {
    return this.settingsService.listSalesAdvisors();
  }

  @Post('sales-advisors')
  async createSalesAdvisor(@Body() body: any) {
    return this.settingsService.createSalesAdvisor({
      nameEn: body.nameEn,
      nameAr: body.nameAr,
      order: typeof body.order === 'number' ? body.order : 0,
      isActive: body.isActive !== false,
    });
  }

  @Put('sales-advisors/:id')
  async updateSalesAdvisor(@Param('id') id: string, @Body() body: any) {
    return this.settingsService.updateSalesAdvisor(id, {
      nameEn: body.nameEn,
      nameAr: body.nameAr,
      order: typeof body.order === 'number' ? body.order : undefined,
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : undefined,
    });
  }

  @Delete('sales-advisors/:id')
  async deleteSalesAdvisor(@Param('id') id: string) {
    return this.settingsService.deleteSalesAdvisor(id);
  }
}

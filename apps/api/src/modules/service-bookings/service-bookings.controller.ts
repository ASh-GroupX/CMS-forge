import { Body, Controller, Get, Param, Patch, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { SessionAuthGuard } from '../../core/auth.guard.js';
import type { AuthenticatedRequest } from '../../core/auth.guard.js';
import { ServiceBookingsService } from './service-bookings.service.js';
import { parseCreateServiceAppointmentBody } from './dto/create-service-appointment.dto.js';
import { parseUpdateServiceAppointmentBody } from './dto/update-service-appointment.dto.js';
import { parseUpdateBranchBookingRulesBody } from './dto/service-booking-rules.dto.js';
import { parseUpsertCarModelBody, parseUpsertMaintenanceTypeBody } from './dto/service-master-data.dto.js';

@UseGuards(SessionAuthGuard)
@Controller('service-bookings')
export class ServiceBookingsController {
  constructor(private readonly service: ServiceBookingsService) {}

  // ── Appointments ──────────────────────────────────────────────────────────
  @Get('appointments')
  async listAppointments(
    @Query('branchId') branchId?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('status') status?: string,
  ) {
    return this.service.listAppointments({ branchId, fromDate, toDate, status });
  }

  @Get('appointments/:id')
  async getAppointment(@Param('id') id: string) {
    return this.service.getAppointment(id);
  }

  @Post('appointments')
  async createAppointment(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    const dto = parseCreateServiceAppointmentBody(body);
    const actorId = req.principal?.userId ?? null;
    return this.service.createAppointment(dto, actorId);
  }

  @Patch('appointments/:id')
  async updateAppointment(@Param('id') id: string, @Body() body: unknown) {
    const dto = parseUpdateServiceAppointmentBody(body);
    return this.service.updateAppointment(id, dto);
  }

  // ── Slot Availability ─────────────────────────────────────────────────────
  @Get('slots-availability')
  async getSlotAvailability(
    @Query('branchId') branchId: string,
    @Query('date') date: string,
  ) {
    if (!branchId || !date) {
      return { error: 'branchId and date are required' };
    }
    return this.service.getSlotAvailability(branchId, date);
  }

  // ── Booking Rules ─────────────────────────────────────────────────────────
  @Get('rules')
  async getBranchRules(@Query('branchId') branchId: string) {
    if (!branchId) return [];
    return this.service.getBranchRules(branchId);
  }

  @Put('rules')
  async updateBranchRules(@Body() body: unknown) {
    const dto = parseUpdateBranchBookingRulesBody(body);
    return this.service.updateBranchRules(dto.branchId, dto.rules);
  }

  // ── Car Models Master Data ────────────────────────────────────────────────
  @Get('car-models')
  async listCarModels(@Query('all') all?: string) {
    return this.service.getCarModels(all !== 'true');
  }

  @Post('car-models')
  async upsertCarModel(@Body() body: unknown) {
    const dto = parseUpsertCarModelBody(body);
    return this.service.upsertCarModel(dto);
  }

  // ── Maintenance Types Master Data ─────────────────────────────────────────
  @Get('maintenance-types')
  async listMaintenanceTypes(@Query('all') all?: string) {
    return this.service.getMaintenanceTypes(all !== 'true');
  }

  @Post('maintenance-types')
  async upsertMaintenanceType(@Body() body: unknown) {
    const dto = parseUpsertMaintenanceTypeBody(body);
    return this.service.upsertMaintenanceType(dto);
  }
}

import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { SessionAuthGuard } from '../../core/auth.guard.js';
import type { AuthenticatedRequest } from '../../core/auth.guard.js';
import { ServiceBookingsService } from './service-bookings.service.js';
import { parseCreateServiceAppointmentBody } from './dto/create-service-appointment.dto.js';
import { parseUpdateServiceAppointmentBody } from './dto/update-service-appointment.dto.js';
import { parseUpdateBranchBookingRulesBody } from './dto/service-booking-rules.dto.js';
import {
  parseUpsertCarModelBody,
  parseUpsertMaintenanceTypeBody,
  parseUpsertServiceCenterBody,
} from './dto/service-master-data.dto.js';

@Controller('service-bookings')
export class ServiceBookingsController {
  constructor(private readonly service: ServiceBookingsService) {}

  // ── Service Centers ───────────────────────────────────────────────────────
  @Get('centers')
  async listServiceCenters(@Query('all') all?: string) {
    return this.service.getServiceCenters(all !== 'true');
  }

  @Post('centers')
  @UseGuards(SessionAuthGuard)
  async upsertServiceCenter(@Body() body: unknown) {
    const dto = parseUpsertServiceCenterBody(body);
    return this.service.upsertServiceCenter(dto);
  }

  @Delete('centers/:id')
  @UseGuards(SessionAuthGuard)
  async deleteServiceCenter(@Param('id') id: string) {
    return this.service.deleteServiceCenter(id);
  }

  // ── Car Models Master Data ────────────────────────────────────────────────
  @Get(['car-models', 'master-data/car-models'])
  async listCarModels(@Query('all') all?: string) {
    return this.service.getCarModels(all !== 'true');
  }

  @Post(['car-models', 'master-data/car-models'])
  @UseGuards(SessionAuthGuard)
  async upsertCarModel(@Body() body: unknown) {
    const dto = parseUpsertCarModelBody(body);
    return this.service.upsertCarModel(dto);
  }

  @Delete(['car-models/:id', 'master-data/car-models/:id'])
  @UseGuards(SessionAuthGuard)
  async deleteCarModel(@Param('id') id: string) {
    return this.service.deleteCarModel(id);
  }

  // ── Maintenance Types Master Data ─────────────────────────────────────────
  @Get(['maintenance-types', 'master-data/maintenance-types'])
  async listMaintenanceTypes(@Query('all') all?: string) {
    return this.service.getMaintenanceTypes(all !== 'true');
  }

  @Post(['maintenance-types', 'master-data/maintenance-types'])
  @UseGuards(SessionAuthGuard)
  async upsertMaintenanceType(@Body() body: unknown) {
    const dto = parseUpsertMaintenanceTypeBody(body);
    return this.service.upsertMaintenanceType(dto);
  }

  @Delete(['maintenance-types/:id', 'master-data/maintenance-types/:id'])
  @UseGuards(SessionAuthGuard)
  async deleteMaintenanceType(@Param('id') id: string) {
    return this.service.deleteMaintenanceType(id);
  }

  // ── Booking Rules ─────────────────────────────────────────────────────────
  @Get('rules/:centerId')
  async getCenterRules(@Param('centerId') centerId: string) {
    return this.service.getBranchRules(centerId);
  }

  @Put('rules/:centerId')
  @UseGuards(SessionAuthGuard)
  async updateCenterRules(@Param('centerId') centerId: string, @Body() body: any) {
    const rules = Array.isArray(body?.rules) ? body.rules : (Array.isArray(body) ? body : []);
    return this.service.updateBranchRules(centerId, rules);
  }

  @Post('rules/:centerId/init-week')
  @UseGuards(SessionAuthGuard)
  async initWeekRules(@Param('centerId') centerId: string) {
    return this.service.initWeekRules(centerId);
  }

  @Get('rules')
  async getBranchRules(@Query('branchId') branchId: string) {
    if (!branchId) return [];
    return this.service.getBranchRules(branchId);
  }

  @Put('rules')
  @UseGuards(SessionAuthGuard)
  async updateBranchRules(@Body() body: unknown) {
    const dto = parseUpdateBranchBookingRulesBody(body);
    return this.service.updateBranchRules(dto.branchId, dto.rules);
  }

  // ── Slot Availability ─────────────────────────────────────────────────────
  @Get(['slots-availability', 'availability'])
  async getSlotAvailability(
    @Query('branchId') branchId: string,
    @Query('date') date: string,
  ) {
    if (!branchId || !date) {
      return { error: 'branchId and date are required' };
    }
    return this.service.getSlotAvailability(branchId, date);
  }

  // ── Appointments ──────────────────────────────────────────────────────────
  @Get(['appointments', ''])
  @UseGuards(SessionAuthGuard)
  async listAppointments(
    @Query('branchId') branchId?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('status') status?: string,
  ) {
    return this.service.listAppointments({ branchId, fromDate, toDate, status });
  }

  @Post(['appointments', ''])
  @UseGuards(SessionAuthGuard)
  async createAppointment(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    const dto = parseCreateServiceAppointmentBody(body);
    const actorId = req.principal?.userId ?? null;
    return this.service.createAppointment(dto, actorId);
  }

  @Get('appointments/:id/history')
  @UseGuards(SessionAuthGuard)
  async getAppointmentHistoryPath(@Param('id') id: string) {
    return this.service.getAppointmentHistory(id);
  }

  @Get('appointments/:id')
  @UseGuards(SessionAuthGuard)
  async getAppointmentPath(@Param('id') id: string) {
    return this.service.getAppointment(id);
  }

  @Patch('appointments/:id')
  @UseGuards(SessionAuthGuard)
  async updateAppointmentPath(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const dto = parseUpdateServiceAppointmentBody(body);
    const actorId = req.principal?.userId ?? null;
    return this.service.updateAppointment(id, dto, actorId);
  }

  // ── Fallback Parameterized Routes (must be last to prevent shadowing) ──────
  @Get(':id/history')
  @UseGuards(SessionAuthGuard)
  async getAppointmentHistory(@Param('id') id: string) {
    return this.service.getAppointmentHistory(id);
  }

  @Get(':id')
  @UseGuards(SessionAuthGuard)
  async getAppointment(@Param('id') id: string) {
    return this.service.getAppointment(id);
  }

  @Patch(':id')
  @UseGuards(SessionAuthGuard)
  async updateAppointment(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const dto = parseUpdateServiceAppointmentBody(body);
    const actorId = req.principal?.userId ?? null;
    return this.service.updateAppointment(id, dto, actorId);
  }
}

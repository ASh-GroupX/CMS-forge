import { Controller, Post, Get, Put, Delete, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { SessionAuthGuard } from '../../core/auth.guard.js';
import type { AuthenticatedRequest } from '../../core/auth.guard.js';
import { AppException } from '../../core/http-kernel.js';
import { InternalTicketsService } from './internal-tickets.service.js';
import { CreateInternalTicketDto } from './dto/create-internal-ticket.dto.js';
import { TransferTicketDto, AssignTicketDto, ResolveTicketDto, WaitTicketDto, RejectTicketDto, AddNoteDto } from './dto/update-internal-ticket.dto.js';

@UseGuards(SessionAuthGuard)
@Controller('internal-tickets')
export class InternalTicketsController {
  constructor(private readonly service: InternalTicketsService) {}

  @Post()
  async create(@Req() req: AuthenticatedRequest, @Body() dto: CreateInternalTicketDto) {
    return this.service.create(req.principal, dto);
  }

  @Get()
  async getMyTickets(@Req() req: AuthenticatedRequest) {
    const departmentId = req.principal?.departmentId;
    const userId = req.principal?.userId;
    if (!departmentId || !userId) return [];
    const tickets = await this.service.getMyTickets(departmentId, userId);
    return tickets;
  }

  @Get('settings/reasons/:type')
  async getSettingsReasons(@Param('type') type: string, @Query('departmentId') departmentId: string, @Req() req: AuthenticatedRequest) {
    return this.service.getSettingsReasons(type, departmentId, req.principal);
  }

  @Post('settings/reasons/:type')
  async createSettingsReason(@Param('type') type: string, @Req() req: AuthenticatedRequest, @Body() dto: any) {
    return this.service.createSettingsReason(type, dto, req.principal);
  }

  @Put('settings/reasons/:type/:id')
  async updateSettingsReason(@Param('type') type: string, @Param('id') id: string, @Req() req: AuthenticatedRequest, @Body() dto: any) {
    return this.service.updateSettingsReason(type, id, dto, req.principal);
  }

  @Delete('settings/reasons/:type/:id')
  async deleteSettingsReason(@Param('type') type: string, @Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.service.deleteSettingsReason(type, id, req.principal);
  }

  @Get('options')
  async getOptions(@Req() req: AuthenticatedRequest) {
    return this.service.getFormOptions(req.principal);
  }

  @Get('team-workload')
  async getTeamWorkload(
    @Req() req: AuthenticatedRequest,
    @Query('filterType') filterType?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('categoryId') categoryId?: string,
    @Query('severity') severity?: string,
  ) {
    const filters: any = {};
    if (filterType !== undefined) filters.filterType = filterType;
    if (dateFrom !== undefined) filters.dateFrom = dateFrom;
    if (dateTo !== undefined) filters.dateTo = dateTo;
    if (categoryId !== undefined) filters.categoryId = categoryId;
    if (severity !== undefined) filters.severity = severity;
    return this.service.getTeamWorkload(req.principal, filters);
  }

  @Get('employee/:employeeId')
  async getEmployeeTickets(@Param('employeeId') employeeId: string, @Req() req: AuthenticatedRequest) {
    return this.service.getEmployeeTickets(employeeId, req.principal);
  }

  @Get('department/:departmentId')
  async getDepartmentTickets(@Param('departmentId') departmentId: string) {
    return this.service.getDepartmentTickets(departmentId);
  }

  @Get(':id')
  async getTicket(@Param('id') id: string) {
    return this.service.getTicket(id);
  }

  @Post(':id/transfer')
  async transfer(@Param('id') id: string, @Req() req: AuthenticatedRequest, @Body() dto: TransferTicketDto) {
    const userId = req.principal!.userId;
    return this.service.transfer(id, userId, dto);
  }

  @Post(':id/assign')
  async assign(@Param('id') id: string, @Req() req: AuthenticatedRequest, @Body() dto: AssignTicketDto) {
    const managerId = req.principal!.userId;
    return this.service.assign(id, managerId, dto);
  }

  @Post(':id/resolve')
  async resolve(@Param('id') id: string, @Req() req: AuthenticatedRequest, @Body() dto: ResolveTicketDto) {
    const employeeId = req.principal!.userId;
    return this.service.resolve(id, employeeId, dto);
  }

  @Post(':id/notes')
  async addNote(@Param('id') id: string, @Req() req: AuthenticatedRequest, @Body() dto: AddNoteDto) {
    const userId = req.principal!.userId;
    return this.service.addNote(id, userId, dto);
  }

  @Post(':id/accept')
  async accept(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const employeeId = req.principal!.userId;
    return this.service.acceptTicket(id, employeeId);
  }

  @Post(':id/wait')
  async wait(@Param('id') id: string, @Req() req: AuthenticatedRequest, @Body() dto: WaitTicketDto) {
    const employeeId = req.principal!.userId;
    return this.service.wait(id, employeeId, dto);
  }

  @Post(':id/approve')
  async approve(@Param('id') id: string, @Req() req: AuthenticatedRequest, @Body() dto: { rating?: number, feedback?: string }) {
    const managerId = req.principal!.userId;
    return this.service.approve(id, managerId, dto);
  }

  @Post(':id/reject')
  async reject(@Param('id') id: string, @Req() req: AuthenticatedRequest, @Body() dto: RejectTicketDto) {
    const managerId = req.principal!.userId;
    return this.service.reject(id, managerId, dto);
  }

  @Post(':id/approve-request')
  async approveRequest(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const managerId = req.principal!.userId;
    return this.service.approveRequest(id, managerId);
  }

  @Post(':id/resubmit')
  async resubmit(@Param('id') id: string, @Body() dto: { reason?: string }, @Req() req: AuthenticatedRequest) {
    const userId = req.principal!.userId;
    return this.service.resubmit(id, userId, dto.reason);
  }

  @Post(':id/assign-team')
  async assignToTeam(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const managerId = req.principal!.userId;
    return this.service.assignToTeam(id, managerId);
  }

  @Delete(':id')
  async deleteTicket(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    if (req.principal?.roleCode !== 'ADMIN') {
      throw new AppException('RBAC_FORBIDDEN', 'Only ADMIN can delete tickets', 403);
    }
    return this.service.deleteTicket(id);
  }

  @Get(':id/attachments/:attachmentId/download')
  async downloadAttachment(@Param('id') id: string, @Param('attachmentId') attachmentId: string) {
    return this.service.downloadAttachment(id, attachmentId);
  }

  @Get(':id/notes/:noteId/attachments/:attachmentId/download')
  async downloadNoteAttachment(@Param('id') id: string, @Param('noteId') noteId: string, @Param('attachmentId') attachmentId: string) {
    return this.service.downloadNoteAttachment(id, noteId, attachmentId);
  }
}

import { Controller, Get, Post, Put, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ComplaintTemplatesService } from './complaint-templates.service.js';
import { parseCreateComplaintTemplateBody, parseUpdateComplaintTemplateBody } from './dto/complaint-template.dto.js';
import { SessionAuthGuard, type AuthenticatedRequest } from '../../core/auth.guard.js';

@Controller('department-complaint-templates')
@UseGuards(SessionAuthGuard)
export class ComplaintTemplatesController {
  constructor(private readonly templatesService: ComplaintTemplatesService) {}

  @Get('department/:departmentId')
  async list(@Param('departmentId') departmentId: string) {
    return this.templatesService.list(departmentId);
  }

  @Post('department/:departmentId')
  async create(
    @Param('departmentId') departmentId: string,
    @Req() req: AuthenticatedRequest,
    @Body() body: unknown
  ) {
    const input = parseCreateComplaintTemplateBody(body);
    const actorId = req.principal?.userId ?? 'system';
    
    // In a real implementation we would check RBAC here:
    // Only DEPARTMENT_MANGER of this department OR ADMIN can create.
    return this.templatesService.create(departmentId, actorId, input);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() body: unknown
  ) {
    const input = parseUpdateComplaintTemplateBody(body);
    const actorId = req.principal?.userId ?? 'system';
    return this.templatesService.update(id, actorId, input);
  }

  @Get(':id')
  async getDetail(@Param('id') id: string) {
    return this.templatesService.getDetail(id);
  }
}

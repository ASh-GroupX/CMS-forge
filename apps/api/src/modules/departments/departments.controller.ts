import { Body, Controller, Get, Param, Patch, Post, Delete, Req, UseGuards } from '@nestjs/common';
import { PermissionGuard, Permissions, SessionAuthGuard } from '../../core/auth.guard.js';
import type { AuthenticatedRequest } from '../../core/auth.guard.js';
import { CsrfGuard } from '../../core/csrf.guard.js';
import { DepartmentsService } from './departments.service.js';
import type { DepartmentResponseDto } from './dto/department-response.dto.js';
import { parseCreateDepartmentBody, parseUpdateDepartmentBody } from './dto/department-write.dto.js';
import { StandardProblemDto, CreateStandardProblemDto, UpdateStandardProblemDto } from './dto/standard-problem.dto.js';

@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get()
  @UseGuards(SessionAuthGuard, PermissionGuard)
  @Permissions('MASTER_DATA_MANAGE')
  async list(): Promise<{ items: DepartmentResponseDto[] }> {
    return { items: await this.departmentsService.listActive() };
  }

  @Get(':idOrCode')
  @UseGuards(SessionAuthGuard, PermissionGuard)
  @Permissions('MASTER_DATA_MANAGE')
  async get(@Param('idOrCode') idOrCode: string): Promise<{ department: DepartmentResponseDto | null }> {
    return { department: await this.departmentsService.findByIdOrCode(idOrCode) };
  }

  @Post()
  @UseGuards(SessionAuthGuard, PermissionGuard, CsrfGuard)
  @Permissions('MASTER_DATA_MANAGE')
  async create(
    @Body() body: unknown,
    @Req() request: AuthenticatedRequest,
  ): Promise<{ department: DepartmentResponseDto }> {
    return {
      department: await this.departmentsService.create(parseCreateDepartmentBody(body), auditContext(request)),
    };
  }

  @Patch(':id')
  @UseGuards(SessionAuthGuard, PermissionGuard, CsrfGuard)
  @Permissions('MASTER_DATA_MANAGE')
  async update(
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() request: AuthenticatedRequest,
  ): Promise<{ department: DepartmentResponseDto }> {
    return {
      department: await this.departmentsService.update(id, parseUpdateDepartmentBody(body), auditContext(request)),
    };
  }

  @Post(':id/deactivate')
  @UseGuards(SessionAuthGuard, PermissionGuard, CsrfGuard)
  @Permissions('MASTER_DATA_MANAGE')
  async deactivate(
    @Param('id') id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<{ department: DepartmentResponseDto }> {
    return { department: await this.departmentsService.deactivate(id, auditContext(request)) };
  }

  @Post(':id/delete')
  @UseGuards(SessionAuthGuard, PermissionGuard, CsrfGuard)
  @Permissions('MASTER_DATA_MANAGE')
  async delete(
    @Param('id') id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<{ department: DepartmentResponseDto }> {
    return { department: await this.departmentsService.delete(id, auditContext(request)) };
  }

  // --- Standard Problems Endpoints ---

  @Get(':id/standard-problems')
  @UseGuards(SessionAuthGuard)
  async listStandardProblems(@Param('id') id: string): Promise<{ items: StandardProblemDto[] }> {
    return { items: await this.departmentsService.listStandardProblems(id) };
  }

  @Post(':id/standard-problems')
  @UseGuards(SessionAuthGuard, PermissionGuard, CsrfGuard)
  @Permissions('MASTER_DATA_MANAGE')
  async createStandardProblem(
    @Param('id') departmentId: string,
    @Body() body: CreateStandardProblemDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<{ problem: StandardProblemDto }> {
    return {
      problem: await this.departmentsService.createStandardProblem(departmentId, body, auditContext(request)),
    };
  }

  @Patch('standard-problems/:id')
  @UseGuards(SessionAuthGuard, PermissionGuard, CsrfGuard)
  @Permissions('MASTER_DATA_MANAGE')
  async updateStandardProblem(
    @Param('id') id: string,
    @Body() body: UpdateStandardProblemDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<{ problem: StandardProblemDto }> {
    return {
      problem: await this.departmentsService.updateStandardProblem(id, body, auditContext(request)),
    };
  }

  @Delete('standard-problems/:id')
  @UseGuards(SessionAuthGuard, PermissionGuard, CsrfGuard)
  @Permissions('MASTER_DATA_MANAGE')
  async deleteStandardProblem(
    @Param('id') id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<{ problem: StandardProblemDto }> {
    return {
      problem: await this.departmentsService.deleteStandardProblem(id, auditContext(request)),
    };
  }
}

function auditContext(request: AuthenticatedRequest) {
  return {
    actorId: request.principal?.userId ?? null,
    correlationId: request.correlationId ?? headerValue(request.headers['x-correlation-id']),
    ipAddress: headerValue(request.headers['x-forwarded-for'])?.split(',')[0]?.trim()
      ?? request.socket?.remoteAddress
      ?? null,
    userAgent: headerValue(request.headers['user-agent']),
  };
}

function headerValue(value: string | string[] | undefined): string | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

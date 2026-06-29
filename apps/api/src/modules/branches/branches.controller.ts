import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { PermissionGuard, Permissions, SessionAuthGuard } from '../../core/auth.guard.js';
import type { AuthenticatedRequest } from '../../core/auth.guard.js';
import { CsrfGuard } from '../../core/csrf.guard.js';
import { BranchesService } from './branches.service.js';
import type { BranchResponseDto } from './dto/branch-response.dto.js';
import { parseCreateBranchBody, parseUpdateBranchBody } from './dto/branch-write.dto.js';

@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  @UseGuards(SessionAuthGuard, PermissionGuard)
  @Permissions('MASTER_DATA_MANAGE')
  async list(): Promise<{ items: BranchResponseDto[] }> {
    return { items: await this.branchesService.listActive() };
  }

  @Get(':idOrCode')
  @UseGuards(SessionAuthGuard, PermissionGuard)
  @Permissions('MASTER_DATA_MANAGE')
  async get(@Param('idOrCode') idOrCode: string): Promise<{ branch: BranchResponseDto | null }> {
    return { branch: await this.branchesService.findByIdOrCode(idOrCode) };
  }

  @Post()
  @UseGuards(SessionAuthGuard, PermissionGuard, CsrfGuard)
  @Permissions('MASTER_DATA_MANAGE')
  async create(
    @Body() body: unknown,
    @Req() request: AuthenticatedRequest,
  ): Promise<{ branch: BranchResponseDto }> {
    return {
      branch: await this.branchesService.create(parseCreateBranchBody(body), auditContext(request)),
    };
  }

  @Patch(':id')
  @UseGuards(SessionAuthGuard, PermissionGuard, CsrfGuard)
  @Permissions('MASTER_DATA_MANAGE')
  async update(
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() request: AuthenticatedRequest,
  ): Promise<{ branch: BranchResponseDto }> {
    return {
      branch: await this.branchesService.update(id, parseUpdateBranchBody(body), auditContext(request)),
    };
  }

  @Post(':id/deactivate')
  @UseGuards(SessionAuthGuard, PermissionGuard, CsrfGuard)
  @Permissions('MASTER_DATA_MANAGE')
  async deactivate(
    @Param('id') id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<{ branch: BranchResponseDto }> {
    return { branch: await this.branchesService.deactivate(id, auditContext(request)) };
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

import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { BoardScope } from '@prisma/client';
import { PermissionGuard, Permissions, SessionAuthGuard } from '../../core/auth.guard.js';
import type { AuthenticatedRequest } from '../../core/auth.guard.js';
import { CsrfGuard } from '../../core/csrf.guard.js';
import { AppException } from '../../core/http-kernel.js';
import { BoardStagesService } from './board-stages.service.js';
import type { BoardStageAdminDto } from './dto/board-stage-response.dto.js';
import {
  parseArchiveBoardStageBody,
  parseCreateBoardStageBody,
  parseReorderBoardStagesBody,
  parseUpdateBoardStageBody,
} from './dto/board-stage-write.dto.js';

@Controller('board-stages')
export class BoardStagesController {
  constructor(private readonly boardStagesService: BoardStagesService) {}

  // Staff read: every board consumer may list active stages; the cards on the
  // boards stay session-scoped in their own endpoints.
  @Get()
  @UseGuards(SessionAuthGuard, PermissionGuard)
  @Permissions('COMPLAINT_COMMENT_INTERNAL')
  async list(@Query('scope') scope?: string): Promise<{ items: BoardStageAdminDto[] }> {
    return { items: await this.boardStagesService.list(scopeParam(scope)) };
  }

  @Post()
  @UseGuards(SessionAuthGuard, PermissionGuard, CsrfGuard)
  @Permissions('MASTER_DATA_MANAGE')
  async create(@Body() body: unknown, @Req() request: AuthenticatedRequest): Promise<{ stage: BoardStageAdminDto }> {
    return { stage: await this.boardStagesService.create(parseCreateBoardStageBody(body), auditContext(request)) };
  }

  @Patch(':id')
  @UseGuards(SessionAuthGuard, PermissionGuard, CsrfGuard)
  @Permissions('MASTER_DATA_MANAGE')
  async update(
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() request: AuthenticatedRequest,
  ): Promise<{ stage: BoardStageAdminDto }> {
    return { stage: await this.boardStagesService.update(id, parseUpdateBoardStageBody(body), auditContext(request)) };
  }

  @Post('reorder')
  @UseGuards(SessionAuthGuard, PermissionGuard, CsrfGuard)
  @Permissions('MASTER_DATA_MANAGE')
  async reorder(@Body() body: unknown, @Req() request: AuthenticatedRequest): Promise<{ items: BoardStageAdminDto[] }> {
    const { scope, orderedIds } = parseReorderBoardStagesBody(body);
    return { items: await this.boardStagesService.reorder(scope, orderedIds, auditContext(request)) };
  }

  @Post(':id/archive')
  @UseGuards(SessionAuthGuard, PermissionGuard, CsrfGuard)
  @Permissions('MASTER_DATA_MANAGE')
  async archive(
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() request: AuthenticatedRequest,
  ): Promise<{ stage: BoardStageAdminDto }> {
    const { destinationStageId } = parseArchiveBoardStageBody(body);
    return { stage: await this.boardStagesService.archive(id, destinationStageId, auditContext(request)) };
  }
}

function scopeParam(value: string | undefined): BoardScope | undefined {
  if (value === undefined) return undefined;
  if (value === BoardScope.TASKS || value === BoardScope.TICKETS) return value;
  throw new AppException('VALIDATION_FAILED', 'Invalid board stage request', 400, [
    { field: 'scope', code: 'REQUIRED', message: 'scope must be TASKS or TICKETS.' },
  ]);
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

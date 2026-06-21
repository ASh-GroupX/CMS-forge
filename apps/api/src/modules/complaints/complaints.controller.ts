import { Body, Controller, Get, HttpStatus, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ComplaintSeverity, ComplaintStatus, RoleCode } from '@prisma/client';
import { BranchScoped, RbacGuard, Roles, SessionAuthGuard } from '../../core/auth.guard.js';
import type { AuthenticatedRequest } from '../../core/auth.guard.js';
import { CsrfGuard } from '../../core/csrf.guard.js';
import { AppException } from '../../core/http-kernel.js';
import { ComplaintFormOptionsService } from './complaint-form-options.service.js';
import { ComplaintsService } from './complaints.service.js';
import type { ComplaintCommentResponseDto, ComplaintPublicCommentsResponseDto } from './dto/complaint-comment.dto.js';
import { parseComplaintCommentBody, toCommentInput } from './dto/complaint-comment.dto.js';
import type { ComplaintDetailResponseDto, ComplaintQueueResponseDto, ComplaintSearchResponseDto } from './dto/complaint-response.dto.js';
import type { CreateComplaintResponseDto } from './dto/create-complaint.dto.js';
import { parseCreateComplaintBody, toCreateComplaintInput } from './dto/create-complaint.dto.js';
import type { ComplaintTransitionResponseDto } from './dto/complaint-transition.dto.js';
import { parseComplaintTransitionBody, toTransitionInput } from './dto/complaint-transition.dto.js';

@Controller('complaints')
export class ComplaintsController {
  constructor(private readonly complaintsService: ComplaintsService, private readonly formOptions: ComplaintFormOptionsService) {}

  @Get()
  @UseGuards(SessionAuthGuard, RbacGuard)
  @Roles(RoleCode.CR_OFFICER, RoleCode.CR_MANAGER, RoleCode.BRANCH_MANAGER, RoleCode.ADMIN)
  @BranchScoped()
  async list(
    @Query('branchId') branchId: string | undefined,
    @Req() request: AuthenticatedRequest,
  ): Promise<ComplaintQueueResponseDto> {
    return { items: await this.complaintsService.listQueue({ branchId: queueBranchId(branchId, request) }) };
  }

  @Get('search')
  @UseGuards(SessionAuthGuard, RbacGuard)
  @Roles(RoleCode.CR_OFFICER, RoleCode.CR_MANAGER, RoleCode.BRANCH_MANAGER, RoleCode.ADMIN)
  @BranchScoped()
  async search(@Query() query: Record<string, string | undefined>, @Req() request: AuthenticatedRequest): Promise<ComplaintSearchResponseDto> {
    const limit = pageNumber(query.limit, 'limit', 25, 100);
    const offset = pageNumber(query.offset, 'offset', 0);
    const items = await this.complaintsService.search({
      branchId: searchBranchId(query.branchId, request),
      referenceNumber: optionalText(query.referenceNumber),
      customer: optionalText(query.customer),
      status: optionalStatus(query.status),
      severity: optionalSeverity(query.severity),
      ownerId: optionalText(query.ownerId),
      dateFrom: optionalText(query.dateFrom),
      dateTo: optionalText(query.dateTo),
    });
    return { items: items.slice(offset, offset + limit), limit, offset };
  }

  @Get('form-options')
  @UseGuards(SessionAuthGuard, RbacGuard)
  @Roles(RoleCode.CR_OFFICER, RoleCode.CR_MANAGER, RoleCode.BRANCH_MANAGER, RoleCode.ADMIN)
  async formOptionsForCreate(@Req() request: AuthenticatedRequest) {
    return this.formOptions.list(request.principal!);
  }

  @Get(':id')
  @UseGuards(SessionAuthGuard, RbacGuard)
  @Roles(RoleCode.CR_OFFICER, RoleCode.CR_MANAGER, RoleCode.BRANCH_MANAGER, RoleCode.ADMIN)
  @BranchScoped()
  async get(
    @Param('id') id: string,
    @Query('branchId') branchId: string | undefined,
    @Req() request: AuthenticatedRequest,
  ): Promise<ComplaintDetailResponseDto> {
    return { complaint: await this.complaintsService.getDetail(id, { branchId: queueBranchId(branchId, request) }) };
  }

  @Post(':id/comments')
  @UseGuards(SessionAuthGuard, RbacGuard, CsrfGuard)
  @Roles(RoleCode.CR_OFFICER, RoleCode.CR_MANAGER, RoleCode.BRANCH_MANAGER, RoleCode.ADMIN)
  @BranchScoped()
  async createComment(
    @Param('id') id: string,
    @Query('branchId') branchId: string | undefined,
    @Body() body: unknown,
    @Req() request: AuthenticatedRequest,
  ): Promise<ComplaintCommentResponseDto> {
    const commentBody = parseComplaintCommentBody(body);
    await this.complaintsService.getDetail(id, { branchId: queueBranchId(branchId, request) });
    return {
      comment: await this.complaintsService.createComment(
        toCommentInput(id, commentBody, auditContext(request)),
      ),
    };
  }

  @Get(':id/comments/public')
  @UseGuards(SessionAuthGuard, RbacGuard)
  @Roles(RoleCode.CR_OFFICER, RoleCode.CR_MANAGER, RoleCode.BRANCH_MANAGER, RoleCode.ADMIN)
  @BranchScoped()
  async listPublicComments(
    @Param('id') id: string,
    @Query('branchId') branchId: string | undefined,
    @Req() request: AuthenticatedRequest,
  ): Promise<ComplaintPublicCommentsResponseDto> {
    await this.complaintsService.getDetail(id, { branchId: queueBranchId(branchId, request) });
    return { items: await this.complaintsService.listPublicComments(id) };
  }

  @Post()
  @UseGuards(SessionAuthGuard, RbacGuard, CsrfGuard)
  @Roles(RoleCode.CR_OFFICER, RoleCode.CR_MANAGER, RoleCode.BRANCH_MANAGER, RoleCode.ADMIN)
  @BranchScoped()
  async create(
    @Query('branchId') branchId: string | undefined,
    @Body() body: unknown,
    @Req() request: AuthenticatedRequest,
  ): Promise<CreateComplaintResponseDto> {
    return {
      complaint: await this.complaintsService.createInternal(
        toCreateComplaintInput(requiredQuery(branchId, 'branchId'), parseCreateComplaintBody(body), auditContext(request)),
      ),
    };
  }

  @Post(':id/transitions')
  @UseGuards(SessionAuthGuard, RbacGuard, CsrfGuard)
  @Roles(RoleCode.CR_OFFICER, RoleCode.CR_MANAGER, RoleCode.BRANCH_MANAGER, RoleCode.ADMIN)
  @BranchScoped()
  async transition(
    @Param('id') id: string,
    @Query('branchId') branchId: string | undefined,
    @Body() body: unknown,
    @Req() request: AuthenticatedRequest,
  ): Promise<ComplaintTransitionResponseDto> {
    const transitionBody = parseComplaintTransitionBody(body);
    await this.complaintsService.getDetail(id, { branchId: queueBranchId(branchId, request) });
    return {
      transition: await this.complaintsService.applyTransition(
        toTransitionInput(id, transitionBody, auditContext(request)),
      ),
    };
  }
}

function auditContext(request: AuthenticatedRequest) {
  return {
    actorId: request.principal?.userId ?? null,
    actorRole: request.principal?.roleCode as RoleCode,
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

function requiredQuery(value: string | undefined, field: string): string {
  if (!value?.trim()) {
    throw new AppException('VALIDATION_FAILED', 'Invalid complaint request', HttpStatus.BAD_REQUEST, [
      { field, code: 'REQUIRED', message: `${field} is required.` },
    ]);
  }
  return value.trim();
}

function queueBranchId(value: string | undefined, request: AuthenticatedRequest): string | null {
  if (value?.trim()) {
    return value.trim();
  }
  return request.principal?.roleCode === RoleCode.ADMIN ? null : request.principal?.branchId ?? null;
}

function searchBranchId(value: string | undefined, request: AuthenticatedRequest): string | null {
  return request.principal?.roleCode === RoleCode.ADMIN ? optionalText(value) : request.principal?.branchId ?? null;
}

function optionalText(value: string | undefined): string | null { return value?.trim() || null; }

function optionalStatus(value: string | undefined): ComplaintStatus | null { return optionalEnum(value, ComplaintStatus, 'status') as ComplaintStatus | null; }

function optionalSeverity(value: string | undefined): ComplaintSeverity | null { return optionalEnum(value, ComplaintSeverity, 'severity') as ComplaintSeverity | null; }

function optionalEnum(value: string | undefined, options: Record<string, string>, field: string): string | null {
  if (!value?.trim()) return null;
  if (Object.values(options).includes(value)) return value;
  throw new AppException('VALIDATION_FAILED', 'Invalid complaint search query', HttpStatus.BAD_REQUEST, [{ field, code: 'INVALID', message: `${field} is invalid.` }]);
}

function pageNumber(value: string | undefined, field: 'limit' | 'offset', fallback: number, max?: number): number {
  if (!value?.trim()) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < (field === 'limit' ? 1 : 0)) {
    throw new AppException('VALIDATION_FAILED', 'Invalid complaint search query', HttpStatus.BAD_REQUEST, [{ field, code: 'INVALID', message: `${field} is invalid.` }]);
  }
  return max ? Math.min(parsed, max) : parsed;
}

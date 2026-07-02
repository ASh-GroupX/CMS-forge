import { Body, Controller, Delete, Get, HttpStatus, Inject, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ComplaintSeverity, ComplaintStatus, ComplaintTransitionAction, RoleCode } from '@prisma/client';
import { BranchScoped, DynamicPermissionGuard, DynamicPermissions, PermissionGuard, Permissions, RbacGuard, SessionAuthGuard } from '../../core/auth.guard.js';
import type { AuthenticatedRequest } from '../../core/auth.guard.js';
import { CsrfGuard } from '../../core/csrf.guard.js';
import { AppException } from '../../core/http-kernel.js';
import { ComplaintFormOptionsService } from './complaint-form-options.service.js';
import { ComplaintRelationsService } from './complaint-relations.service.js';
import { ComplaintsService } from './complaints.service.js';
import type { ComplaintCommentResponseDto, ComplaintCommentsResponseDto, ComplaintPublicCommentsResponseDto } from './dto/complaint-comment.dto.js';
import { parseComplaintCommentBody, toCommentInput } from './dto/complaint-comment.dto.js';
import type { ComplaintCorrectionResponseDto } from './dto/complaint-correction.dto.js';
import { parseComplaintCorrectionBody, toComplaintCorrectionInput } from './dto/complaint-correction.dto.js';
import type { ComplaintDetailResponseDto, ComplaintDuplicateCandidatesResponseDto, ComplaintQueueResponseDto, ComplaintRelatedResponseDto, ComplaintRelationMutationResponseDto, ComplaintSearchResponseDto } from './dto/complaint-response.dto.js';
import type { CreateComplaintResponseDto } from './dto/create-complaint.dto.js';
import { parseCreateComplaintBody, toCreateComplaintInput } from './dto/create-complaint.dto.js';
import type { ComplaintTransitionResponseDto } from './dto/complaint-transition.dto.js';
import { parseComplaintTransitionBody, toTransitionInput } from './dto/complaint-transition.dto.js';

@Controller('complaints')
export class ComplaintsController {
  constructor(
    @Inject(ComplaintsService) private readonly complaintsService: ComplaintsService,
    @Inject(ComplaintFormOptionsService) private readonly formOptions: ComplaintFormOptionsService,
    @Inject(ComplaintRelationsService) private readonly relationsService: ComplaintRelationsService,
  ) {}

  @Get()
  @UseGuards(SessionAuthGuard, PermissionGuard, RbacGuard)
  @Permissions('COMPLAINT_VIEW_BRANCH')
  @BranchScoped()
  async list(
    @Query('branchId') branchId: string | undefined,
    @Req() request: AuthenticatedRequest,
  ): Promise<ComplaintQueueResponseDto> {
    return { items: await this.complaintsService.listQueue({ branchId: queueBranchId(branchId, request), role: requestRole(request) }) };
  }

  @Get('search')
  @UseGuards(SessionAuthGuard, PermissionGuard, RbacGuard)
  @Permissions('COMPLAINT_VIEW_BRANCH')
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
      role: requestRole(request),
    });
    return { items: items.slice(offset, offset + limit), limit, offset };
  }

  @Get('form-options')
  @UseGuards(SessionAuthGuard, PermissionGuard)
  @Permissions('COMPLAINT_CREATE')
  async formOptionsForCreate(@Req() request: AuthenticatedRequest) {
    return this.formOptions.list(request.principal!);
  }

  @Get(':id')
  @UseGuards(SessionAuthGuard, PermissionGuard, RbacGuard)
  @Permissions('COMPLAINT_VIEW_BRANCH')
  @BranchScoped()
  async get(
    @Param('id') id: string,
    @Query('branchId') branchId: string | undefined,
    @Req() request: AuthenticatedRequest,
  ): Promise<ComplaintDetailResponseDto> {
    const complaint = await this.complaintsService.getDetail(id, { branchId: queueBranchId(branchId, request), role: requestRole(request) });
    const principal = request.principal!;
    return { complaint: { ...complaint, allowedActions: this.complaintsService.allowedActionsFor(complaint, { roleCode: principal.roleCode as RoleCode, userId: principal.userId }) } };
  }

  @Get(':id/related')
  @UseGuards(SessionAuthGuard, PermissionGuard, RbacGuard)
  @Permissions('COMPLAINT_VIEW_BRANCH')
  @BranchScoped()
  async listRelated(
    @Param('id') id: string,
    @Query('branchId') branchId: string | undefined,
    @Req() request: AuthenticatedRequest,
  ): Promise<ComplaintRelatedResponseDto> {
    return { items: await this.relationsService.listRelated(id, { branchId: queueBranchId(branchId, request) }) };
  }

  @Get(':id/duplicate-candidates')
  @UseGuards(SessionAuthGuard, PermissionGuard, RbacGuard)
  @Permissions('COMPLAINT_VIEW_BRANCH')
  @BranchScoped()
  async duplicateCandidates(
    @Param('id') id: string,
    @Query('branchId') branchId: string | undefined,
    @Req() request: AuthenticatedRequest,
  ): Promise<ComplaintDuplicateCandidatesResponseDto> {
    return this.relationsService.duplicateCandidates(id, { branchId: queueBranchId(branchId, request) });
  }

  @Post(':id/related')
  @UseGuards(SessionAuthGuard, PermissionGuard, RbacGuard, CsrfGuard)
  @Permissions('COMPLAINT_EDIT')
  @BranchScoped()
  async linkRelated(
    @Param('id') id: string,
    @Query('branchId') branchId: string | undefined,
    @Body() body: unknown,
    @Req() request: AuthenticatedRequest,
  ): Promise<ComplaintRelationMutationResponseDto> {
    return { relation: await this.relationsService.link({ sourceComplaintId: id, targetComplaintId: targetComplaintId(body), branchId: queueBranchId(branchId, request), ...auditContext(request) }) };
  }

  @Delete(':id/related/:targetId')
  @UseGuards(SessionAuthGuard, PermissionGuard, RbacGuard, CsrfGuard)
  @Permissions('COMPLAINT_EDIT')
  @BranchScoped()
  async unlinkRelated(
    @Param('id') id: string,
    @Param('targetId') targetId: string,
    @Query('branchId') branchId: string | undefined,
    @Req() request: AuthenticatedRequest,
  ): Promise<ComplaintRelationMutationResponseDto> {
    return { relation: await this.relationsService.unlink({ sourceComplaintId: id, targetComplaintId: targetId, branchId: queueBranchId(branchId, request), ...auditContext(request) }) };
  }

  @Post(':id/comments')
  @UseGuards(SessionAuthGuard, DynamicPermissionGuard, RbacGuard, CsrfGuard)
  @DynamicPermissions(commentPermission)
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

  @Get(':id/comments')
  @UseGuards(SessionAuthGuard, PermissionGuard, RbacGuard)
  @Permissions('COMPLAINT_COMMENT_INTERNAL')
  @BranchScoped()
  async listComments(@Param('id') id: string, @Query('branchId') branchId: string | undefined, @Req() request: AuthenticatedRequest): Promise<ComplaintCommentsResponseDto> { await this.complaintsService.getDetail(id, { branchId: queueBranchId(branchId, request) }); return { items: await this.complaintsService.listComments(id) }; }

  @Get(':id/comments/public')
  @UseGuards(SessionAuthGuard, PermissionGuard, RbacGuard)
  @Permissions('COMPLAINT_VIEW_BRANCH')
  @BranchScoped()
  async listPublicComments(@Param('id') id: string, @Query('branchId') branchId: string | undefined, @Req() request: AuthenticatedRequest): Promise<ComplaintPublicCommentsResponseDto> { await this.complaintsService.getDetail(id, { branchId: queueBranchId(branchId, request) }); return { items: await this.complaintsService.listPublicComments(id) }; }

  @Post()
  @UseGuards(SessionAuthGuard, PermissionGuard, RbacGuard, CsrfGuard)
  @Permissions('COMPLAINT_CREATE')
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

  @Post(':id/corrections')
  @UseGuards(SessionAuthGuard, PermissionGuard, RbacGuard, CsrfGuard)
  @Permissions('COMPLAINT_EDIT')
  @BranchScoped()
  async correct(@Param('id') id: string, @Query('branchId') branchId: string | undefined, @Body() body: unknown, @Req() request: AuthenticatedRequest): Promise<ComplaintCorrectionResponseDto> { const correctionBody = parseComplaintCorrectionBody(body); await this.complaintsService.getDetail(id, { branchId: queueBranchId(branchId, request) }); return { correction: await this.complaintsService.correctProvenance(toComplaintCorrectionInput(id, correctionBody, auditContext(request))) }; }

  @Post(':id/transitions')
  @UseGuards(SessionAuthGuard, DynamicPermissionGuard, RbacGuard, CsrfGuard)
  @DynamicPermissions(transitionPermission)
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

function commentPermission(request: AuthenticatedRequest): string[] {
  const visibility = bodyField(request.body, 'visibility');
  if (visibility === 'INTERNAL') return ['COMPLAINT_COMMENT_INTERNAL'];
  if (visibility === 'PUBLIC') return ['COMPLAINT_COMMENT_PUBLIC'];
  return [];
}

function transitionPermission(request: AuthenticatedRequest): string[] {
  const action = bodyField(request.body, 'action');
  switch (action) {
    case ComplaintTransitionAction.SUBMIT: return ['COMPLAINT_SUBMIT'];
    case ComplaintTransitionAction.ACCEPT_INTAKE:
    case ComplaintTransitionAction.APPROVE_AND_ROUTE:
    case ComplaintTransitionAction.SEND_BACK: return ['COMPLAINT_APPROVE'];
    case ComplaintTransitionAction.ASSIGN_INVESTIGATION:
    case ComplaintTransitionAction.ROUTE_AGAIN: return ['COMPLAINT_ASSIGN'];
    case ComplaintTransitionAction.RESOLVE:
    case ComplaintTransitionAction.RESOLVE_DIRECTLY: return ['COMPLAINT_RESOLVE'];
    case ComplaintTransitionAction.CLOSE: return ['COMPLAINT_CLOSE'];
    case ComplaintTransitionAction.REOPEN: return ['COMPLAINT_REOPEN'];
    case ComplaintTransitionAction.ADD_INVESTIGATION_UPDATE: return ['COMPLAINT_COMMENT_INTERNAL'];
    case ComplaintTransitionAction.REJECT_AS_INVALID:
    case ComplaintTransitionAction.REJECT_AFTER_REVIEW:
    case ComplaintTransitionAction.REJECT_AFTER_INVESTIGATION:
    case ComplaintTransitionAction.REJECT_RESOLUTION: return ['COMPLAINT_REJECT'];
    default: return [];
  }
}

function bodyField(body: unknown, field: string): string | undefined {
  return body && typeof body === 'object' ? (body as Record<string, unknown>)[field] as string | undefined : undefined;
}

function auditContext(request: AuthenticatedRequest) {
  return {
    actorId: request.principal?.userId ?? null,
    actorRole: request.principal?.roleCode as RoleCode,
    sessionId: request.principal?.sessionId ?? null,
    correlationId: request.correlationId ?? headerValue(request.headers['x-correlation-id']),
    ipAddress: headerValue(request.headers['x-forwarded-for'])?.split(',')[0]?.trim()
      ?? request.socket?.remoteAddress
      ?? null,
    userAgent: headerValue(request.headers['user-agent']),
  };
}

function targetComplaintId(body: unknown): string {
  const raw = body && typeof body === 'object' ? (body as Record<string, unknown>).targetComplaintId : undefined;
  const value = typeof raw === 'string' ? raw.trim() : '';
  if (!value) throw new AppException('VALIDATION_FAILED', 'Invalid complaint relation request', HttpStatus.BAD_REQUEST, [{ field: 'targetComplaintId', code: 'REQUIRED', message: 'targetComplaintId is required.' }]);
  return value;
}

function headerValue(value: string | string[] | undefined): string | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function requiredQuery(value: string | undefined, field: string): string {
  if (!value?.trim()) {
    throw new AppException('VALIDATION_FAILED', 'Invalid complaint request', HttpStatus.BAD_REQUEST, [{ field, code: 'REQUIRED', message: `${field} is required.` }]);
  }
  return value.trim();
}

function queueBranchId(value: string | undefined, request: AuthenticatedRequest): string | null {
  if (value?.trim()) return value.trim();
  return request.principal?.roleCode === RoleCode.ADMIN ? null : request.principal?.branchId ?? null;
}

function searchBranchId(value: string | undefined, request: AuthenticatedRequest): string | null {
  return request.principal?.roleCode === RoleCode.ADMIN ? optionalText(value) : request.principal?.branchId ?? null;
}

function optionalText(value: string | undefined): string | null { return value?.trim() || null; }

function requestRole(request: AuthenticatedRequest): RoleCode { return request.principal?.roleCode as RoleCode; }

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

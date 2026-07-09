import { Body, Controller, Delete, Get, Inject, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { RoleCode } from '@prisma/client';
import { BranchScoped, DynamicPermissionGuard, DynamicPermissions, PermissionGuard, Permissions, RbacGuard, SessionAuthGuard } from '../../core/auth.guard.js';
import type { AuthenticatedRequest } from '../../core/auth.guard.js';
import { CsrfGuard } from '../../core/csrf.guard.js';
import { ComplaintFormOptionsService } from './complaint-form-options.service.js';
import { auditContext, commentPermission, optionalSeverity, optionalSlaState, optionalStatus, optionalText, pageNumber, queueBranchId, requestRole, requiredQuery, searchBranchId, targetComplaintId, transitionPermission } from './complaints.controller-helpers.js';
import { ComplaintRelationsService } from './complaint-relations.service.js';
import { ComplaintsService } from './complaints.service.js';
import type { ComplaintCommentResponseDto, ComplaintCommentsResponseDto, ComplaintPublicCommentsResponseDto } from './dto/complaint-comment.dto.js';
import { parseComplaintCommentBody, toCommentInput } from './dto/complaint-comment.dto.js';
import type { ComplaintCorrectionResponseDto } from './dto/complaint-correction.dto.js';
import { parseComplaintCorrectionBody, toComplaintCorrectionInput } from './dto/complaint-correction.dto.js';
import type { ComplaintDetailResponseDto, ComplaintDuplicateCandidatesResponseDto, ComplaintQueueResponseDto, ComplaintRelatedResponseDto, ComplaintRelationMutationResponseDto, ComplaintSearchResponseDto, ComplaintTimelineResponseDto } from './dto/complaint-response.dto.js';
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
    const sla = optionalSlaState(query.sla);
    const items = await this.complaintsService.search({
      branchId: searchBranchId(query.branchId, request),
      referenceNumber: optionalText(query.referenceNumber),
      customer: optionalText(query.customer),
      status: optionalStatus(query.status),
      severity: optionalSeverity(query.severity),
      ...(sla ? { sla } : {}),
      ownerId: optionalText(query.ownerId),
      dateFrom: optionalText(query.dateFrom),
      dateTo: optionalText(query.dateTo),
      limit,
      offset,
      role: requestRole(request),
    });
    return { items, limit, offset };
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

  @Get(':id/timeline')
  @UseGuards(SessionAuthGuard, PermissionGuard, RbacGuard)
  @Permissions('COMPLAINT_VIEW_BRANCH')
  @BranchScoped()
  async timeline(
    @Param('id') id: string,
    @Query('branchId') branchId: string | undefined,
    @Req() request: AuthenticatedRequest,
  ): Promise<ComplaintTimelineResponseDto> {
    return { items: await this.complaintsService.timeline(id, { branchId: queueBranchId(branchId, request), role: requestRole(request) }) };
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

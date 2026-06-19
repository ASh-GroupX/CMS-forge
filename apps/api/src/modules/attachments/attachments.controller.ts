import { Body, Controller, Get, Headers, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { RoleCode } from '@prisma/client';
import type { IncomingMessage } from 'node:http';
import { BranchScoped, RbacGuard, Roles, SessionAuthGuard } from '../../core/auth.guard.js';
import type { AuthenticatedRequest } from '../../core/auth.guard.js';
import { CsrfGuard } from '../../core/csrf.guard.js';
import { ComplaintsService } from '../complaints/complaints.service.js';
import { PortalService } from '../portal/portal.service.js';
import { AttachmentsService } from './attachments.service.js';
import type { AttachmentDownloadResponseDto, AttachmentUploadResponseDto } from './dto/attachment-response.dto.js';
import { attachmentDownloadDto, attachmentDto } from './dto/attachment-response.dto.js';
import { parseCreateAttachmentBody, toCreateAttachmentInput } from './dto/create-attachment.dto.js';

@Controller('complaints/:complaintId/attachments')
export class AttachmentsController {
  constructor(
    private readonly attachmentsService: AttachmentsService,
    private readonly complaintsService: ComplaintsService,
  ) {}

  @Post()
  @UseGuards(SessionAuthGuard, RbacGuard, CsrfGuard)
  @Roles(RoleCode.CR_OFFICER, RoleCode.CR_MANAGER, RoleCode.BRANCH_MANAGER, RoleCode.ADMIN)
  @BranchScoped()
  async create(
    @Param('complaintId') complaintId: string,
    @Query('branchId') branchId: string | undefined,
    @Body() body: unknown,
    @Req() request: AuthenticatedRequest,
  ): Promise<AttachmentUploadResponseDto> {
    const requestBody = parseCreateAttachmentBody(body);
    const complaint = await this.complaintsService.getDetail(complaintId, { branchId: queueBranchId(branchId, request) });
    return {
      attachment: attachmentDto(await this.attachmentsService.createUpload(
        toCreateAttachmentInput(complaintId, requestBody, { ...auditContext(request), branchId: complaint.branchId }),
      )),
    };
  }

  @Get(':attachmentId/download')
  @UseGuards(SessionAuthGuard, RbacGuard)
  @Roles(RoleCode.CR_OFFICER, RoleCode.CR_MANAGER, RoleCode.BRANCH_MANAGER, RoleCode.ADMIN)
  @BranchScoped()
  async prepareDownload(
    @Param('complaintId') complaintId: string,
    @Param('attachmentId') attachmentId: string,
    @Query('branchId') branchId: string | undefined,
    @Req() request: AuthenticatedRequest,
  ): Promise<AttachmentDownloadResponseDto> {
    const complaint = await this.complaintsService.getDetail(complaintId, { branchId: queueBranchId(branchId, request) });
    return {
      download: attachmentDownloadDto(await this.attachmentsService.prepareStaffDownload({
        complaintId,
        attachmentId,
        ...auditContext(request),
        branchId: complaint.branchId,
      })),
    };
  }
}

@Controller('portal/attachments')
export class PortalAttachmentsController {
  constructor(
    private readonly attachmentsService: AttachmentsService,
    private readonly portalService: PortalService,
  ) {}

  @Post()
  async create(
    @Headers('x-portal-session') sessionToken: string | undefined,
    @Body() body: unknown,
    @Req() request: IncomingMessage & { correlationId?: string },
  ): Promise<AttachmentUploadResponseDto> {
    const requestBody = parseCreateAttachmentBody(body);
    const context = auditContext(request);
    const portal = await this.portalService.resolveAttachmentUpload({
      sessionToken: sessionToken ?? '',
      correlationId: context.correlationId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
    return {
      attachment: attachmentDto(await this.attachmentsService.createUpload(
        toCreateAttachmentInput(portal.complaintId, { ...requestBody, customerVisible: true }, { ...context, actorId: null, branchId: portal.branchId }),
      )),
    };
  }
}

function auditContext(request: AuthenticatedRequest | (IncomingMessage & { correlationId?: string })) {
  return {
    actorId: 'principal' in request ? request.principal?.userId ?? null : null,
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

function queueBranchId(value: string | undefined, request: AuthenticatedRequest): string | null {
  if (value?.trim()) return value.trim();
  return request.principal?.roleCode === RoleCode.ADMIN ? null : request.principal?.branchId ?? null;
}

import { Body, Controller, Get, Headers, HttpStatus, Param, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { AppException } from '../../core/http-kernel.js';
import { RoleCode } from '@prisma/client';
import type { IncomingMessage } from 'node:http';
import { BranchScoped, PermissionGuard, Permissions, RbacGuard, SessionAuthGuard } from '../../core/auth.guard.js';
import type { AuthenticatedRequest } from '../../core/auth.guard.js';
import { CsrfGuard } from '../../core/csrf.guard.js';
import { ComplaintsService } from '../complaints/complaints.service.js';
import { PortalService } from '../portal/portal.service.js';
import { AttachmentsService } from './attachments.service.js';
import type { AttachmentDownloadResponseDto, AttachmentListResponseDto, AttachmentUploadResponseDto } from './dto/attachment-response.dto.js';
import { attachmentDownloadDto, attachmentDto, attachmentListDto } from './dto/attachment-response.dto.js';
import { parseCreateAttachmentBody, toCreateAttachmentInput } from './dto/create-attachment.dto.js';

@Controller('complaints/:complaintId/attachments')
export class AttachmentsController {
  constructor(
    private readonly attachmentsService: AttachmentsService,
    private readonly complaintsService: ComplaintsService,
  ) {}

  @Get()
  @UseGuards(SessionAuthGuard, PermissionGuard, RbacGuard)
  @Permissions('ATTACHMENT_DOWNLOAD')
  @BranchScoped()
  async list(
    @Param('complaintId') complaintId: string,
    @Query('branchId') branchId: string | undefined,
    @Req() request: AuthenticatedRequest,
  ): Promise<AttachmentListResponseDto> {
    await this.complaintsService.getDetail(complaintId, { branchId: queueBranchId(branchId, request) });
    return { items: attachmentListDto(await this.attachmentsService.listForComplaint(complaintId)) };
  }

  @Post()
  @UseGuards(SessionAuthGuard, PermissionGuard, RbacGuard, CsrfGuard)
  @Permissions('ATTACHMENT_UPLOAD_STAFF')
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
  @UseGuards(SessionAuthGuard, PermissionGuard, RbacGuard)
  @Permissions('ATTACHMENT_DOWNLOAD')
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

@Controller(['attachments', 'api/attachments'])
export class RawAttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Get('raw/:storageKey')
  async serveRaw(@Param('storageKey') storageKey: string, @Req() req: any, @Res() res: any) {
    return this.serve(storageKey, req, res);
  }

  @Get('raw/*')
  async serveRawWildcard(@Req() req: any, @Res() res: any) {
    const raw = req.params[0] || req.url.split('/raw/')[1] || '';
    return this.serve(raw, req, res);
  }

  private serve(storageKey: string, req: any, res: any) {
    let key = (storageKey || req.url.split('/raw/')[1] || '').trim();
    if (key.startsWith('/')) key = key.slice(1);
    const qIndex = key.indexOf('?');
    if (qIndex !== -1) key = key.slice(0, qIndex);

    let decoded = key;
    try { decoded = decodeURIComponent(key); } catch {}

    const file = this.attachmentsService.getRawFile(decoded) || this.attachmentsService.getRawFile(key);
    if (!file) throw new AppException('ATTACHMENT_NOT_FOUND', 'Attachment object was not found', HttpStatus.NOT_FOUND);
    res.setHeader('Content-Type', file.contentType || 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(file.bytes);
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
  const role = request.principal?.roleCode;
  const isGlobal = role === RoleCode.ADMIN || role === RoleCode.CR_MANAGER || role === RoleCode.CR_OFFICER || Boolean(request.principal?.permissions?.includes('COMPLAINT_VIEW_ALL'));
  return isGlobal ? null : request.principal?.branchId ?? null;
}

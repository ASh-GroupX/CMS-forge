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
import * as path from 'node:path';
import { isPublicHttpUrl } from './attachment-storage.port.js';
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
    @Query('redirect') redirect?: string,
    @Query('download') download?: string,
    @Res({ passthrough: true }) response?: any,
  ): Promise<AttachmentDownloadResponseDto | void> {
    const complaint = await this.complaintsService.getDetail(complaintId, { branchId: queueBranchId(branchId, request) });
    const downloadDto = attachmentDownloadDto(await this.attachmentsService.prepareStaffDownload({
      complaintId,
      attachmentId,
      ...auditContext(request),
      branchId: complaint.branchId,
    }));

    const accept = (request?.headers?.['accept'] as string) ?? '';
    const shouldStream = redirect === '1' || download === '1' || accept.includes('text/html');

    if (shouldStream && response) {
      const metadata = await this.attachmentsService.findMetadata(attachmentId);
      const storageKey = metadata?.storageKey || downloadDto.token;
      const file = await this.attachmentsService.getRawFile(storageKey);
      if (file) {
        let filename = metadata?.fileName || path.basename(storageKey) || 'attachment';
        if (!path.extname(filename)) {
          const ct = (file.contentType || metadata?.contentType || '').toLowerCase();
          if (ct.includes('jpeg') || ct.includes('jpg')) filename += '.jpg';
          else if (ct.includes('png')) filename += '.png';
          else if (ct.includes('webp')) filename += '.webp';
          else if (ct.includes('pdf')) filename += '.pdf';
          else filename += '.jpg';
        }
        response.setHeader('Content-Type', file.contentType || metadata?.contentType || 'application/octet-stream');
        response.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
        response.setHeader('Cache-Control', 'private, no-store');
        return response.send(file.bytes);
      }

      const target = isPublicHttpUrl(downloadDto.token)
        ? downloadDto.token
        : `/api/attachments/raw/${encodeURIComponent(downloadDto.token.startsWith('/') ? downloadDto.token : (metadata?.storageKey || attachmentId))}`;
      return response.redirect(302, target);
    }

    if (downloadDto.token && isHttpUrl(downloadDto.token) && !isPublicHttpUrl(downloadDto.token)) {
      const metadata = await this.attachmentsService.findMetadata(attachmentId);
      downloadDto.token = `/api/attachments/raw/${encodeURIComponent(metadata?.storageKey || attachmentId)}`;
    }

    return { download: downloadDto };
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
    return this.serve('', req, res);
  }

  private async serve(storageKeyParam: string, req: any, res: any) {
    let rawFromUrl = '';
    const url = req.url || '';
    const rawIdx = url.indexOf('/raw/');
    if (rawIdx !== -1) {
      rawFromUrl = url.slice(rawIdx + 5);
      const qIdx = rawFromUrl.indexOf('?');
      if (qIdx !== -1) rawFromUrl = rawFromUrl.slice(0, qIdx);
    }
    if (rawFromUrl.startsWith('/')) rawFromUrl = rawFromUrl.slice(1);

    const candidates = [
      rawFromUrl,
      decodeKey(rawFromUrl),
      storageKeyParam,
      decodeKey(storageKeyParam),
    ].filter(Boolean);

    let file: { bytes: Buffer; contentType: string; fileName?: string } | null = null;
    let foundKey = rawFromUrl || storageKeyParam;
    for (const cand of candidates) {
      file = await this.attachmentsService.getRawFile(cand);
      if (file) {
        foundKey = cand;
        break;
      }
    }

    if (!file) throw new AppException('ATTACHMENT_NOT_FOUND', 'Attachment object was not found', HttpStatus.NOT_FOUND);

    let filename = file.fileName || path.basename(foundKey) || 'attachment';
    if (!path.extname(filename)) {
      const ct = (file.contentType || '').toLowerCase();
      if (ct.includes('jpeg') || ct.includes('jpg')) filename += '.jpg';
      else if (ct.includes('png')) filename += '.png';
      else if (ct.includes('webp')) filename += '.webp';
      else if (ct.includes('pdf')) filename += '.pdf';
      else filename += '.jpg';
    }
    res.setHeader('Content-Type', file.contentType || 'image/jpeg');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('Cache-Control', 'private, no-store');
    res.send(file.bytes);
  }
}

function decodeKey(val: string): string {
  try { return decodeURIComponent(val); } catch { return val; }
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
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

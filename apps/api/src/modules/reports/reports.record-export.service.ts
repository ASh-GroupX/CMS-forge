import { HttpStatus, Injectable } from '@nestjs/common';
import { RoleCode } from '@prisma/client';
import { ZipArchive } from 'archiver';
import PDFDocument from 'pdfkit';
import { PassThrough } from 'node:stream';
import { AuditService } from '../../core/audit.service.js';
import { AppException, PrismaService } from '../../core/http-kernel.js';
import { AttachmentsService } from '../attachments/attachments.service.js';
import type { DashboardReportScope, ReportExportAudit } from './reports.service.js';

type RecordType = 'complaint' | 'ticket';
type ArchiveAttachment = { id: string; fileName: string; contentType: string; sizeBytes: number; storageKey: string };
type ArchiveRecord = { id: string; referenceNumber: string; title: string; data: Record<string, unknown>; attachments: ArchiveAttachment[] };

@Injectable()
export class ReportsRecordExportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly attachments: AttachmentsService,
    private readonly audit: AuditService,
  ) {}

  async createArchive(type: RecordType, id: string, scope: DashboardReportScope, context: ReportExportAudit) {
    const record = type === 'complaint'
      ? await this.complaintRecord(id, scope)
      : await this.ticketRecord(id, scope);
    if (!record) throw new AppException('RBAC_FORBIDDEN', 'Record is not available in your report scope', HttpStatus.FORBIDDEN);

    const root = `${safeName(record.title)}_${safeName(record.referenceNumber)}`;
    const output = new PassThrough();
    const zip = new ZipArchive({ zlib: { level: 6 } });
    const manifest: Array<Record<string, unknown>> = [];
    zip.on('error', (error: Error) => output.destroy(error));
    zip.pipe(output);

    const exportedAt = new Date().toISOString();
    const report = await reportPdf(record, exportedAt);
    zip.append(report, { name: `${root}/Task_Report.pdf` });
    zip.append(JSON.stringify(record.data, null, 2), { name: `${root}/Task_Data.json` });
    zip.append(await sectionPdf('Notes and comments', readArray(record.data, 'notes')), { name: `${root}/Notes/Notes_Report.pdf` });
    zip.append(await sectionPdf('Investigation', readArray(record.data, 'investigation')), { name: `${root}/Investigation/Investigation_Report.pdf` });
    zip.append(await sectionPdf('Activity timeline', readArray(record.data, 'timeline')), { name: `${root}/Activity_Log/Complete_Timeline.pdf` });
    zip.append(await sectionPdf('Resolution', readArray(record.data, 'resolution')), { name: `${root}/Resolution/Resolution_Report.pdf` });

    for (const attachment of record.attachments) {
      const file = await this.attachments.getRawFile(attachment.storageKey);
      if (!file) {
        manifest.push({ id: attachment.id, fileName: attachment.fileName, status: 'unavailable' });
        continue;
      }
      const archiveName = `${root}/Attachments/${attachment.id}_${safeName(attachment.fileName)}`;
      zip.append(file.bytes, { name: archiveName });
      manifest.push({ id: attachment.id, fileName: attachment.fileName, contentType: file.contentType, sizeBytes: file.bytes.byteLength, status: 'included' });
    }

    zip.append(JSON.stringify({ schemaVersion: 1, type, recordId: record.id, referenceNumber: record.referenceNumber, exportedAt, attachments: manifest }, null, 2), {
      name: `${root}/Export_Manifest.json`,
    });
    void zip.finalize();
    await this.audit.record({
      eventType: 'REPORT', action: 'complete_record_exported', actorId: context.actorId ?? null,
      branchId: context.branchId ?? null, targetType: type, targetId: record.id,
      correlationId: context.correlationId ?? null, ipAddress: context.ipAddress ?? null,
      userAgent: context.userAgent ?? null, metadata: { referenceNumber: record.referenceNumber, attachmentCount: manifest.length },
    });
    return { stream: output, fileName: `${root}.zip` };
  }

  private async complaintRecord(id: string, scope: DashboardReportScope): Promise<ArchiveRecord | null> {
    const row = await this.prisma.complaint.findFirst({
      where: {
        id,
        ...(scope.role === RoleCode.ADMIN ? {} : scope.branchId ? { branchId: scope.branchId } : {}),
        ...(scope.role === RoleCode.CR_MANAGER || (!scope.branchId && scope.role !== RoleCode.ADMIN)
          ? { departmentId: scope.departmentId ?? '__no_department_scope__' }
          : {}),
      },
      include: {
        branch: { select: { id: true, nameEn: true, nameAr: true } },
        department: { select: { id: true, nameEn: true, nameAr: true } },
        category: { select: { id: true, nameEn: true, nameAr: true } },
        customer: { select: { id: true, nameEn: true, nameAr: true, phone: true, email: true } },
        vehicle: true,
        createdBy: { select: { id: true, nameEn: true, nameAr: true } },
        owner: { select: { id: true, nameEn: true, nameAr: true } },
        comments: { orderBy: { createdAt: 'asc' }, include: { author: { select: { id: true, nameEn: true, nameAr: true } } } },
        statusHistory: { orderBy: { createdAt: 'asc' }, include: { actor: { select: { id: true, nameEn: true, nameAr: true } } } },
        attachments: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!row) return null;
    const attachments = row.attachments.map(fileMeta);
    const data = {
      record: withoutAttachments(row),
      notes: row.comments,
      investigation: row.investigationNotes ? [{ notes: row.investigationNotes, investigatedAt: row.investigatedAt }] : [],
      timeline: row.statusHistory,
      resolution: [{ resolvedAt: row.resolvedAt, closedAt: row.closedAt, status: row.status }],
      attachments: attachments.map(publicFileMeta),
    };
    return { id: row.id, referenceNumber: row.referenceNumber, title: row.subject, data, attachments };
  }

  private async ticketRecord(id: string, scope: DashboardReportScope): Promise<ArchiveRecord | null> {
    const departmentId = scope.departmentId ?? '__no_department_scope__';
    const row = await this.prisma.internalTicket.findFirst({
      where: {
        id,
        ...(scope.role === RoleCode.ADMIN ? {} : scope.role === RoleCode.CR_MANAGER
          ? { targetDepartmentId: departmentId }
          : scope.branchId ? { targetDepartment: { branchId: scope.branchId } } : { targetDepartmentId: departmentId }),
      },
      include: {
        requestedBy: { select: { id: true, nameEn: true, nameAr: true, departmentId: true } },
        assignedEmployee: { select: { id: true, nameEn: true, nameAr: true } },
        targetDepartment: { select: { id: true, nameEn: true, nameAr: true, branchId: true } },
        category: { select: { id: true, nameEn: true, nameAr: true } },
        waitingReason: true, resolutionReason: true, rejectReason: true,
        activities: { orderBy: { createdAt: 'asc' }, include: { actor: { select: { id: true, nameEn: true, nameAr: true } } } },
        notes: { orderBy: { createdAt: 'asc' }, include: { author: { select: { id: true, nameEn: true, nameAr: true } }, attachments: true } },
        attachments: { orderBy: { createdAt: 'asc' } }, rating: true,
      },
    });
    if (!row) return null;
    const noteAttachments = row.notes.flatMap((note) => note.attachments.map(fileMeta));
    const attachments = [...row.attachments.map(fileMeta), ...noteAttachments];
    const { attachments: _files, notes: _notes, activities: _activities, ...record } = row;
    const data = {
      record, notes: row.notes.map(({ attachments: _noteFiles, ...note }) => note),
      investigation: [], timeline: row.activities,
      resolution: [{ resolutionReason: row.resolutionReason, resolutionDetails: row.resolutionDetails, resolvedAt: row.resolvedAt, closedAt: row.closedAt }],
      attachments: attachments.map(publicFileMeta),
    };
    return { id: row.id, referenceNumber: row.referenceNumber, title: row.title, data, attachments };
  }
}

function fileMeta(file: ArchiveAttachment): ArchiveAttachment { return { id: file.id, fileName: file.fileName, contentType: file.contentType, sizeBytes: file.sizeBytes, storageKey: file.storageKey }; }
function publicFileMeta({ storageKey: _key, ...file }: ArchiveAttachment) { return file; }
function withoutAttachments<T extends { attachments: unknown }>(row: T) { const { attachments: _files, ...record } = row; return record; }
function safeName(value: string) { return value.normalize('NFKC').replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').replace(/\.{2,}/g, '_').trim().slice(0, 100) || 'record'; }
function readArray(data: Record<string, unknown>, key: string): unknown[] { return Array.isArray(data[key]) ? data[key] : []; }

async function reportPdf(record: ArchiveRecord, exportedAt: string) {
  return createPdf('Laith Al Obeidi CMS — Complete Record', [
    `Reference: ${record.referenceNumber}`, `Title: ${record.title}`, `Generated: ${exportedAt}`,
    '', JSON.stringify(record.data, null, 2),
  ]);
}
async function sectionPdf(title: string, values: unknown[]) { return createPdf(title, values.length ? values.map((value) => JSON.stringify(value, null, 2)) : ['No recorded entries.']); }
function createPdf(title: string, lines: string[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 54, size: 'A4', info: { Title: title, Author: 'Laith Al Obeidi CMS' } });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.fontSize(18).fillColor('#16352f').text(title).moveDown(0.75);
    doc.fontSize(9).fillColor('#26312f');
    for (const line of lines) doc.text(line, { width: 485 }).moveDown(0.35);
    doc.end();
  });
}

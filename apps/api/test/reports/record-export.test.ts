import assert from 'node:assert/strict';
import test from 'node:test';
import { RoleCode } from '@prisma/client';
import { ReportsRecordExportService } from '../../src/modules/reports/reports.record-export.service.js';

const scope = { role: RoleCode.ADMIN, branchId: null, departmentId: null, userId: 'admin-1' };

test('complete record export streams a ZIP with original attachment bytes and writes audit', async () => {
  const audits: any[] = [];
  const prisma: any = {
    internalTicket: {
      findFirst: async () => ({
        id: 'ticket-1', referenceNumber: 'TKT-1001', title: 'Printer repair', description: 'Paper jam',
        status: 'RESOLVED', priority: 'NORMAL', resolutionDetails: 'Roller replaced', resolvedAt: new Date('2026-10-01T10:00:00Z'), closedAt: null,
        requestedBy: { id: 'user-1', nameEn: 'Rami Saleh', nameAr: 'رامي', departmentId: 'sales' },
        assignedEmployee: { id: 'user-2', nameEn: 'Maya Haddad', nameAr: 'مايا' },
        targetDepartment: { id: 'it', nameEn: 'IT', nameAr: 'تقنية المعلومات', branchId: 'branch-1' },
        category: { id: 'cat-1', nameEn: 'Hardware', nameAr: 'أجهزة' },
        waitingReason: null, resolutionReason: { id: 'fixed', reasonEn: 'Fixed' }, rejectReason: null,
        activities: [{ id: 'event-1', action: 'RESOLVED', details: null, createdAt: new Date('2026-10-01T10:00:00Z'), actor: { id: 'user-2', nameEn: 'Maya Haddad', nameAr: 'مايا' } }],
        notes: [{ id: 'note-1', content: 'Tested successfully', createdAt: new Date('2026-10-01T09:30:00Z'), author: { id: 'user-2', nameEn: 'Maya Haddad', nameAr: 'مايا' }, attachments: [] }],
        attachments: [{ id: 'file-1', fileName: '../diagnostic.txt', contentType: 'text/plain', sizeBytes: 10, storageKey: 'attachments/file-1' }],
        rating: null,
      }),
    },
  };
  const attachments: any = { getRawFile: async () => ({ bytes: Buffer.from('diagnostic'), contentType: 'text/plain' }) };
  const audit: any = { record: async (entry: any) => { audits.push(entry); } };
  const service = new ReportsRecordExportService(prisma, attachments, audit);

  const archive = await service.createArchive('ticket', 'ticket-1', scope, { actorId: 'admin-1' });
  const chunks: Buffer[] = [];
  for await (const chunk of archive.stream) chunks.push(Buffer.from(chunk));
  const bytes = Buffer.concat(chunks);

  assert.equal(bytes.subarray(0, 2).toString(), 'PK');
  assert.match(archive.fileName, /^Printer repair_TKT-1001\.zip$/);
  assert.equal(bytes.includes(Buffer.from('diagnostic')), true);
  assert.equal(bytes.includes(Buffer.from('../diagnostic.txt')), false);
  assert.equal(audits[0]?.action, 'complete_record_exported');
});

test('complete record export fails closed when the record is outside report scope', async () => {
  const prisma: any = { complaint: { findFirst: async () => null } };
  const service = new ReportsRecordExportService(prisma, {} as any, { record: async () => undefined } as any);
  await assert.rejects(
    () => service.createArchive('complaint', 'hidden', { role: RoleCode.CR_MANAGER, branchId: null, departmentId: 'dept-1' }, {}),
    (error: any) => error?.code === 'RBAC_FORBIDDEN',
  );
});

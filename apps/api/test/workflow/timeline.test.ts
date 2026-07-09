import assert from 'node:assert/strict';
import test from 'node:test';
import { timelineItems } from '../../src/modules/complaints/complaint-timeline.ts';
import type { ComplaintTimelineFacts } from '../../src/modules/complaints/complaints.repository.ts';
import type { ComplaintDetailDto } from '../../src/modules/complaints/dto/complaint-response.dto.ts';

test('complaint timeline includes attachment audit events without exposing scan/download publicly', () => {
  const items = timelineItems({ id: 'cmp_1', referenceNumber: 'CMP-1' } as ComplaintDetailDto, {
    attachmentAudits: [
      audit('att_1', 'attachment_uploaded', '2026-06-20T09:00:00.000Z', { complaintId: 'cmp_1', customerVisible: true }),
      audit('att_1', 'attachment_scan_clean', '2026-06-20T10:00:00.000Z', { complaintId: 'cmp_1', toStatus: 'CLEAN' }),
      audit('att_1', 'attachment_download_prepared', '2026-06-20T11:00:00.000Z', { complaintId: 'cmp_1' }),
    ],
    attachments: [{ id: 'att_1', fileName: 'invoice.pdf', contentType: 'application/pdf', sizeBytes: 500, scanStatus: 'CLEAN', customerVisible: true, uploadedById: 'staff_1', createdAt: new Date('2026-06-20T09:00:00.000Z'), uploadedBy: { nameEn: 'Agent' } }],
    comments: [], notifications: [], slaEvents: [], statusHistory: [],
  } as unknown as ComplaintTimelineFacts, []);

  assert.deepEqual(items.map((item) => item.summary), ['Attachment uploaded: invoice.pdf', 'Attachment scan clean: invoice.pdf', 'Attachment download prepared: invoice.pdf']);
  assert.deepEqual(items.map((item) => item.customerVisible), [true, false, false]);
});

function audit(targetId: string, action: string, createdAt: string, metadata: Record<string, unknown>) {
  return { id: `${action}_${targetId}`, action, actorId: 'staff_1', targetId, createdAt: new Date(createdAt), metadata, actor: { nameEn: 'Agent' } };
}

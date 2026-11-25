import assert from 'node:assert/strict';
import test from 'node:test';
import { detailItem } from '../../src/modules/complaints/complaint-read-models.js';

function complaint(statusHistory: unknown[], investigatedAt: Date | null, investigationNotes: string | null) {
  return {
    id: 'complaint-1', referenceNumber: 'CMP-1', status: 'IN_PROGRESS', severity: 'MEDIUM',
    subject: 'Noise', branch: { timezone: 'Asia/Amman' }, createdAt: new Date(), updatedAt: new Date(),
    customer: { id: 'customer-1', nameEn: 'Customer', phone: '0790000000', dataSource: 'LOCAL' },
    vehicle: null, incidentAt: null, statusHistory, investigatedAt, investigationNotes,
  } as never;
}

test('investigation findings name the backup officer who wrote the latest update', () => {
  const at = new Date('2026-11-25T09:00:00.000Z');
  const history = [
    { id: 'older', action: 'ADD_INVESTIGATION_UPDATE', createdAt: new Date(at.getTime() - 60_000), actor: { nameEn: 'Primary', nameAr: 'الرئيسي' } },
    { id: 'latest', action: 'ADD_INVESTIGATION_UPDATE', createdAt: new Date(at.getTime() - 20), actor: { nameEn: 'Backup', nameAr: 'البديل' } },
    { id: 'later', action: 'RESOLVE', createdAt: new Date(at.getTime() + 10_000), actor: { nameEn: 'Manager', nameAr: 'المدير' } },
  ];
  assert.deepEqual(detailItem(complaint(history, at, 'Checked wiring')).investigationAuthor,
    { name: 'Backup', nameAr: 'البديل' });
});

test('legacy findings without matching history are left unattributed', () => {
  assert.equal(detailItem(complaint([], new Date(), 'Old finding')).investigationAuthor, null);
  assert.equal(detailItem(complaint([], null, null)).investigationAuthor, null);
});

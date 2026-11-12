import assert from 'node:assert/strict';
import test from 'node:test';
import { defaultPortalFields } from '@cms-auto/contracts';
import { AppException } from '../../src/core/http-kernel.js';
import { PortalFormService } from '../../src/modules/portal-intake/portal-form.service.js';
import { updatePortalAnswers } from '../../src/modules/portal-intake/portal-form-answers.js';

const catalog = [{ id: 'm1', brand: 'Nissan', nameEn: 'Patrol', nameAr: 'باترول' }];
function service() {
  const records: unknown[] = [];
  let saved: { version: number; fields: unknown } | null = null;
  const repository = {
    form: async () => saved,
    transaction: async (work: (tx: unknown) => Promise<unknown>) => work({}),
    saveForm: async (fields: unknown, version: number | null) => { saved = { version: (version ?? 0) + 1, fields }; return saved; },
  };
  const audit = { record: async (record: unknown) => { records.push(record); } };
  const bookings = { getCarModels: async (activeOnly: boolean) => { assert.equal(activeOnly, true); return catalog; } };
  return { instance: new PortalFormService(repository as never, audit as never, bookings as never), records };
}
const valid = { customerName: 'A', customerPhone: '+962790000000', vehicleBrand: 'Nissan', vehicleModel: 'Patrol', vehicleVin: '1HGCM82633A004352', odometer: null, incidentAt: '2026-11-12', description: 'A concern', attachments: [] };
test('VIN is required by default while every built-in field can be made optional', async () => {
  const { instance } = service();
  const initial = await instance.get();
  assert.equal(initial.fields.find((field) => field.key === 'vehicleVin')?.required, true);
  await assert.rejects(instance.validate({ ...valid, vehicleVin: null }), (error: unknown) => error instanceof AppException && error.fieldErrors.some((item) => item.field === 'vehicleVin'));
  const fields = initial.fields.map((field) => ({ ...field, required: false }));
  await instance.save({ expectedVersion: null, fields }, 'admin');
  const result = await instance.validate({ customerName: '', customerPhone: '', vehicleBrand: '', vehicleModel: '', vehicleVin: null, incidentAt: '', description: '', attachments: [] });
  assert.equal(result.values.vehicleVin, null);
  assert.equal(result.values.customerPhone, null);
});
test('custom choices validate and answers survive later field configuration changes', async () => {
  const { instance, records } = service();
  const fields = [...defaultPortalFields, { key: 'custom_visit', labelEn: 'Visit', labelAr: 'الزيارة', type: 'select' as const, required: true, enabled: true, options: [{ value: 'workshop', labelEn: 'Workshop', labelAr: 'الورشة' }] }];
  await instance.save({ expectedVersion: null, fields }, 'admin');
  await assert.rejects(instance.validate({ ...valid, customFields: { custom_visit: 'unknown' } }), (error: unknown) => error instanceof AppException && error.fieldErrors.some((item) => item.field === 'customFields.custom_visit'));
  const snapshot = await instance.validate({ ...valid, customFields: { custom_visit: 'workshop' } });
  await instance.save({ expectedVersion: 1, fields: fields.map((field) => field.key === 'custom_visit' ? { ...field, enabled: false } : field) }, 'admin');
  assert.equal(snapshot.values.custom_visit, 'workshop');
  const corrected = updatePortalAnswers(snapshot as never, { customerName: 'B' }, { custom_visit: 'workshop' }) as { values: Record<string, unknown>; originalValues: Record<string, unknown> };
  assert.equal(corrected.values.customerName, 'B');
  assert.equal(corrected.originalValues.customerName, 'A');
  assert.doesNotMatch(JSON.stringify(records), /\+962790000000|A concern|workshop/);
});
test('inactive and mismatched booking cars are rejected and stale settings conflict', async () => {
  const { instance } = service();
  await assert.rejects(instance.validate({ ...valid, vehicleBrand: 'Toyota' }), (error: unknown) => error instanceof AppException && error.fieldErrors.some((item) => item.field === 'vehicleBrand'));
  await assert.rejects(instance.validate({ ...valid, vehicleModel: 'Camry' }), (error: unknown) => error instanceof AppException && error.fieldErrors.some((item) => item.field === 'vehicleModel'));
  await instance.save({ expectedVersion: null, fields: defaultPortalFields }, 'admin');
  await assert.rejects(instance.save({ expectedVersion: null, fields: defaultPortalFields }, 'admin'), (error: unknown) => error instanceof AppException && error.getStatus() === 409);
});
test('required custom text rejects whitespace, and clearing an optional answer removes its current value', async () => {
  const { instance } = service();
  const fields = [...defaultPortalFields, { key: 'custom_note', labelEn: 'Note', labelAr: 'ملاحظة', type: 'text' as const, required: true, enabled: true }];
  await instance.save({ expectedVersion: null, fields }, 'admin');
  await assert.rejects(instance.validate({ ...valid, customFields: { custom_note: '   ' } }), (error: unknown) => error instanceof AppException && error.fieldErrors.some((item) => item.field === 'customFields.custom_note'));
  const optional = { ...fields.at(-1)!, required: false };
  const snapshot = await instance.validate({ ...valid, customFields: { custom_note: 'Old content' } }, { version: 2, fields: [...defaultPortalFields, optional] });
  const corrected = updatePortalAnswers(snapshot as never, {}, { custom_note: '' }) as { values: Record<string, unknown>; originalValues: Record<string, unknown> };
  assert.equal(corrected.values.custom_note, null);
  assert.equal(corrected.originalValues.custom_note, 'Old content');
});

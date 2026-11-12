import { HttpStatus, Injectable } from '@nestjs/common';
import { defaultPortalFields, type PortalField, type PortalAnswer, type PortalForm } from '@cms-auto/contracts';
import type { Prisma } from '@prisma/client';
import { AuditService } from '../../core/audit.service.js';
import { AppException } from '../../core/http-kernel.js';
import { ServiceBookingsService } from '../service-bookings/service-bookings.service.js';
import { PortalIntakeRepository } from './portal-intake.repository.js';
@Injectable()
export class PortalFormService {
  constructor(private readonly repository: PortalIntakeRepository, private readonly audit: AuditService, private readonly bookings: ServiceBookingsService) {}
  async get(): Promise<PortalForm> { const form = await this.repository.form(); return { version: form?.version ?? null, fields: form ? form.fields as unknown as PortalField[] : structuredClone(defaultPortalFields) }; }
  async catalog() { return (await this.bookings.getCarModels(true)).map(({ id, brand, nameEn, nameAr }) => ({ id, brand, nameEn, nameAr })); }
  async assertVehicle(brand: string | null | undefined, model: string | null | undefined) {
    if (!brand && !model) return;
    const catalog = await this.catalog();
    if (!brand || !catalog.some((item) => item.brand === brand)) invalid('vehicleBrand');
    if (model && !catalog.some((item) => item.brand === brand && item.nameEn === model)) invalid('vehicleModel');
  }
  async validate(input: Record<string, unknown>, form?: PortalForm) {
    const schema = form ?? await this.get();
    const custom = input.customFields && typeof input.customFields === 'object' && !Array.isArray(input.customFields) ? input.customFields as Record<string, unknown> : {};
    const known = new Set(schema.fields.filter((field) => field.enabled && field.key.startsWith('custom_')).map((field) => field.key));
    for (const key of Object.keys(custom)) if (!known.has(key)) invalid(`customFields.${key}`);
    const values: Record<string, PortalAnswer> = {}; const errors: { field: string; code: string; message: string }[] = [];
    for (const field of schema.fields.filter((field) => field.enabled)) {
      const key = field.key; const path = key.startsWith('custom_') ? `customFields.${key}` : key;
      const raw = key === 'attachments' ? (Array.isArray(input.attachments) ? input.attachments.length : 0) : key.startsWith('custom_') ? custom[key] : input[key];
      const empty = raw === null || raw === undefined || typeof raw === 'string' && !raw.trim() || field.type === 'checkbox' && raw !== true || field.type === 'file' && raw === 0;
      if (empty) { values[key] = null; if (field.required) errors.push({ field: path, code: 'REQUIRED', message: 'Required field.' }); continue; }
      if (field.type === 'number' && (typeof raw !== 'number' || !Number.isFinite(raw)) || field.type === 'checkbox' && typeof raw !== 'boolean' || !['number', 'checkbox', 'file'].includes(field.type) && (typeof raw !== 'string' || raw.length > (key === 'description' ? 10000 : 2000))) { errors.push({ field: path, code: 'INVALID', message: 'Invalid value.' }); continue; }
      if (field.type === 'select' && !field.options?.some((choice) => choice.value === raw) || field.type === 'date' && !Number.isFinite(Date.parse(String(raw)))) { errors.push({ field: path, code: 'INVALID', message: 'Invalid value.' }); continue; }
      values[key] = raw as PortalAnswer;
    }
    if (errors.length) throw new AppException('VALIDATION_FAILED', 'Check form fields.', HttpStatus.BAD_REQUEST, errors);
    await this.assertVehicle(String(input.vehicleBrand ?? ''), String(input.vehicleModel ?? ''));
    return { version: schema.version, fields: schema.fields, values, originalValues: values };
  }
  async save(body: unknown, actorId: string) {
    const input = parseForm(body);
    try {
      return await this.repository.transaction(async (tx) => {
        const current = await this.repository.form(tx);
        if ((current?.version ?? null) !== input.expectedVersion) conflict();
        const result = await this.repository.saveForm(JSON.parse(JSON.stringify(input.fields)) as Prisma.InputJsonValue, input.expectedVersion, tx);
        if (!result) conflict();
        await this.audit.record({ eventType: 'CONFIG', action: 'portal_form_fields_updated', actorId, branchId: null, targetType: 'portal_intake_form', targetId: 'default', metadata: { version: result.version, fieldKeys: input.fields.map((field) => field.key), requiredKeys: input.fields.filter((field) => field.required && field.enabled).map((field) => field.key) } }, tx);
        return { version: result.version, fields: input.fields };
      });
    } catch (error) { if (error && typeof error === 'object' && 'code' in error && ['P2002', 'P2034'].includes(String(error.code))) conflict(); throw error; }
  }
}
function parseForm(body: unknown): { expectedVersion: number | null; fields: PortalField[] } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) invalid();
  const value = body as Record<string, unknown>;
  if (value.expectedVersion !== null && (!Number.isSafeInteger(value.expectedVersion) || Number(value.expectedVersion) < 1) || !Array.isArray(value.fields) || value.fields.length < defaultPortalFields.length || value.fields.length > 50) invalid();
  const keys = new Set<string>();
  const text = (value: unknown, max = 200): string => { if (typeof value !== 'string' || !value.trim() || value.length > max) invalid(); return value.trim(); };
  const fields = value.fields.map((raw: unknown): PortalField => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) invalid(); const field = raw as Record<string, unknown>;
    const key = text(field.key, 80); if (keys.has(key)) invalid(); keys.add(key);
    const base = defaultPortalFields.find((item) => item.key === key);
    if (!base && !/^custom_[a-zA-Z0-9_]{1,60}$/.test(key) || typeof field.required !== 'boolean' || typeof field.enabled !== 'boolean') invalid();
    const type = text(field.type); if (base ? type !== base.type || field.enabled !== true : !['text', 'textarea', 'number', 'date', 'select', 'checkbox'].includes(type)) invalid();
    const options = type === 'select' ? Array.isArray(field.options) && field.options.length > 0 && field.options.length <= 50 ? field.options.map((raw) => { if (!raw || typeof raw !== 'object') invalid(); return { value: text(raw.value), labelEn: text(raw.labelEn), labelAr: text(raw.labelAr) }; }) : invalid() : undefined;
    if (options && new Set(options.map((item) => item.value)).size !== options.length) invalid();
    return { key, labelEn: text(field.labelEn), labelAr: text(field.labelAr), type: type as PortalField['type'], required: field.required as boolean, enabled: field.enabled as boolean, ...(options ? { options } : {}) };
  });
  if (defaultPortalFields.some((field) => !keys.has(field.key))) invalid();
  return { expectedVersion: value.expectedVersion as number | null, fields };
}
function invalid(field = 'fields'): never { throw new AppException('VALIDATION_FAILED', 'Invalid complaint form configuration or value.', HttpStatus.BAD_REQUEST, [{ field, code: 'INVALID', message: 'Check this field.' }]); }
function conflict(): never { throw new AppException('COMPLAINT_INVALID_TRANSITION', 'Form changed. Reload and retry.', HttpStatus.CONFLICT); }

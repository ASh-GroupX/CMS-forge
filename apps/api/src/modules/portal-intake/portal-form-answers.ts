import type { Prisma } from '@prisma/client';
import type { PortalField, PortalAnswer } from '@cms-auto/contracts';
import { HttpStatus } from '@nestjs/common';
import { AppException } from '../../core/http-kernel.js';

type Snapshot = { version: number | null; fields: PortalField[]; values: Record<string, PortalAnswer>; originalValues: Record<string, PortalAnswer> };
export function updatePortalAnswers(raw: Prisma.JsonValue | null, corrections: Record<string, PortalAnswer>, custom?: Record<string, unknown>): Prisma.InputJsonValue | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const snapshot = raw as unknown as Snapshot;
  if (!Array.isArray(snapshot.fields) || !snapshot.values || typeof snapshot.values !== 'object') return null;
  const values = { ...snapshot.values, ...corrections };
  const fields = snapshot.fields.filter((field) => field.enabled && field.key.startsWith('custom_'));
  const allowed = new Set(fields.map((field) => field.key));
  for (const key of Object.keys(custom ?? {})) if (!allowed.has(key)) invalid(key);
  for (const field of fields) {
    if (!custom || !(field.key in custom)) continue;
    const value = custom[field.key];
    if (value === null || value === undefined || typeof value === 'string' && !value.trim() || field.type === 'checkbox' && value === false) { if (field.required) invalid(field.key); values[field.key] = null; continue; }
    if (field.type === 'number' && (typeof value !== 'number' || !Number.isFinite(value)) || field.type === 'checkbox' && typeof value !== 'boolean' || !['number', 'checkbox'].includes(field.type) && (typeof value !== 'string' || value.length > 2000)) invalid(field.key);
    if (field.type === 'select' && !field.options?.some((item) => item.value === value) || field.type === 'date' && !Number.isFinite(Date.parse(String(value)))) invalid(field.key);
    values[field.key] = value as PortalAnswer;
  }
  return JSON.parse(JSON.stringify({ ...snapshot, values })) as Prisma.InputJsonValue;
}
function invalid(field: string): never { throw new AppException('VALIDATION_FAILED', 'Invalid complaint field value.', HttpStatus.BAD_REQUEST, [{ field: `customFields.${field}`, code: 'INVALID', message: 'Check this field.' }]); }

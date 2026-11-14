import { AppException } from '../../../core/http-kernel.js';

export type UpsertServiceBookingLaneDto = {
  id?: string;
  serviceCenterId: string;
  code: string;
  nameEn: string;
  nameAr: string;
  maxDailyAppointments: number;
  maxPerHour: number;
  maxPerSlot: number;
  position: number;
  isActive: boolean;
  expectedUpdatedAt?: string;
};

export function parseUpsertServiceBookingLaneBody(input: unknown): UpsertServiceBookingLaneDto {
  if (!input || typeof input !== 'object') invalid('body');
  const body = input as Record<string, unknown>;
  const serviceCenterId = text(body.serviceCenterId);
  const nameEn = text(body.nameEn) || text(body.nameAr);
  const nameAr = text(body.nameAr) || text(body.nameEn);
  const code = (text(body.code) || nameEn).toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '');
  if (!serviceCenterId) invalid('serviceCenterId');
  if (!nameEn || !nameAr || !code) invalid('nameEn');

  const expectedUpdatedAt = text(body.expectedUpdatedAt);
  if (expectedUpdatedAt && Number.isNaN(Date.parse(expectedUpdatedAt))) invalid('expectedUpdatedAt');
  return {
    ...(text(body.id) ? { id: text(body.id) } : {}),
    serviceCenterId,
    code,
    nameEn,
    nameAr,
    maxDailyAppointments: positive(body.maxDailyAppointments, 'maxDailyAppointments'),
    maxPerHour: positive(body.maxPerHour, 'maxPerHour'),
    maxPerSlot: positive(body.maxPerSlot, 'maxPerSlot'),
    position: Math.max(0, Number(body.position) || 0),
    isActive: body.isActive === undefined ? true : body.isActive === true,
    ...(expectedUpdatedAt ? { expectedUpdatedAt } : {}),
  };
}

function positive(value: unknown, field: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 1000) invalid(field);
  return parsed;
}

function text(value: unknown) { return typeof value === 'string' ? value.trim() : ''; }

function invalid(field: string): never {
  throw new AppException('VALIDATION_FAILED', 'Invalid booking lane', 400, [
    { field, code: 'INVALID', message: `Check ${field}.` },
  ]);
}

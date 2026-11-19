import { HttpStatus } from '@nestjs/common';
import { AppException } from '../../../core/http-kernel.js';

export type CreateServiceBookingClosureDto = {
  serviceCenterId: string;
  startDate: string;
  endDate: string;
  reason: string;
};

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export function parseCreateServiceBookingClosureBody(body: unknown, serviceCenterId: string): CreateServiceBookingClosureDto {
  const value = body && typeof body === 'object' ? body as Record<string, unknown> : {};
  const startDate = String(value.startDate ?? '');
  const endDate = String(value.endDate ?? '');
  const reason = String(value.reason ?? '').trim();
  if (!serviceCenterId || !datePattern.test(startDate) || !datePattern.test(endDate)
    || !validDate(startDate) || !validDate(endDate) || endDate < startDate || !reason || reason.length > 200) {
    throw new AppException('VALIDATION_FAILED', 'Provide a valid center, date range, and reason (1–200 characters)', HttpStatus.BAD_REQUEST);
  }
  return { serviceCenterId, startDate, endDate, reason };
}

function validDate(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

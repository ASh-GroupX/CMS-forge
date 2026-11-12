import { randomUUID } from 'node:crypto';
import { HttpStatus } from '@nestjs/common';
import { type Prisma } from '@prisma/client';
import { AppException } from '../../core/http-kernel.js';
import type { PortalIntakeService } from '../portal-intake/portal-intake.service.js';
import type { CreateInternalComplaintInput } from '../complaints/complaints.service.js';
import type { SubmitPortalComplaintInput } from './portal.service.js';
export async function resolvePortalSubmission(input: SubmitPortalComplaintInput, configuration?: PortalIntakeService): Promise<CreateInternalComplaintInput> {
  if (input.manualTriage !== true) { const { attachments: _attachments, customFields: _customFields, ...safe } = input; return { ...safe, customerNumber: null } as CreateInternalComplaintInput; }
  const defaults = await configuration?.defaults();
  if (!defaults) throw new AppException('PORTAL_OPTIONS_REQUIRED', 'Intake defaults are not configured.', HttpStatus.BAD_REQUEST, [{ field: 'manualTriage', code: 'UNAVAILABLE', message: 'Intake defaults are unavailable.' }]);
  const form = configuration?.validateForm ? await configuration.validateForm(input as unknown as Record<string, unknown>) : null;
  const phoneDefaults = await configuration?.publicDefaults();
  const digits = input.customerPhone?.replace(/[\s()\-]/g, '') ?? '';
  const phone = !digits ? null : digits.startsWith('+') ? digits : `${phoneDefaults?.phoneCountryCode ?? '+962'}${digits.replace(/^0+/, '')}`;
  if (phone && !/^\+[1-9]\d{7,14}$/.test(phone)) throw new AppException('VALIDATION_FAILED', 'Invalid phone', HttpStatus.BAD_REQUEST, [{ field: 'customerPhone', code: 'INVALID', message: 'Invalid phone.' }]);
  const { attachments: _attachments, customFields: _customFields, ...base } = input;
  return { ...base, customerName: input.customerName || '—', customerPhone: phone, customerNumber: phone ? null : `PORTAL-${randomUUID()}`, description: input.description || '—', incidentAt: input.incidentAt || new Date().toISOString(), branchId: defaults.branchId, categoryId: defaults.categoryId, departmentId: null, subject: input.customerName?.trim() || '—', vehicleRelated: true, vehicleDataUnavailableReason: input.vehicleVin ? null : 'VIN not supplied at intake', severity: 'MEDIUM', ...(form ? { portalData: JSON.parse(JSON.stringify(form)) as Prisma.InputJsonValue } : {}) };
}

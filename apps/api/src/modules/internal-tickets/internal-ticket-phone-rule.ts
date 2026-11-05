import { Prisma } from '@prisma/client';
import { AppException } from '../../core/http-kernel.js';
import { AuditService } from '../../core/audit.service.js';

type Principal = { userId: string; roleCode: string; departmentId?: string | null };
export function normalizeTicketPhone(value: unknown): string {
  if (typeof value !== 'string') throw new AppException('VALIDATION_FAILED', 'An international customer phone number is required', 400);
  const phone = value.trim().replace(/[٠-٩۰-۹]/g, digit => String(digit.charCodeAt(0) - (digit >= '۰' ? 1776 : 1632)))
    .replace(/[\s().-]/g, '').replace(/^00/, '+');
  if (!/^\+[1-9]\d{7,14}$/.test(phone)) throw new AppException('VALIDATION_FAILED', 'Include an international country code, for example +962790000000', 400);
  return phone;
}

export function readableTicketScope(principal: Principal): Prisma.InternalTicketWhereInput {
  if (!principal?.userId) throw new AppException('AUTH_INVALID_CREDENTIALS', 'Sign in required', 401);
  if (principal.roleCode === 'ADMIN') return {};
  return { OR: [
    { requestedById: principal.userId }, { assignedEmployeeId: principal.userId },
    ...(principal.departmentId ? [{ targetDepartmentId: principal.departmentId }, { requestedBy: { departmentId: principal.departmentId } }] : []),
  ] };
}

export async function phoneMatches(tx: Prisma.TransactionClient, phone: string, principal: Principal) {
  const rows = await tx.ticketCustomerPhone.findMany({
    where: { phone, ticket: readableTicketScope(principal) }, distinct: ['ticketId'], take: 20,
    orderBy: { ticket: { createdAt: 'desc' } },
    select: { ticket: { select: { id: true, referenceNumber: true, title: true, status: true } } },
  });
  return rows.map(row => row.ticket);
}

export async function enforcePhoneRule(tx: Prisma.TransactionClient, principal: Principal,
  fields: { id: string; nameEn: string; isRequired: boolean; phoneDuplicateCheck: boolean }[],
  values: Record<string, unknown>, acknowledgedFields: string[]) {
  const phones: { fieldId: string; phone: string }[] = [];
  for (const field of fields) {
    const value = values[field.id];
    if (field.isRequired && (value === undefined || value === null || typeof value === 'string' && !value.trim())) {
      throw new AppException('VALIDATION_FAILED', `Field "${field.nameEn}" is required`, 400);
    }
    if (field.phoneDuplicateCheck) phones.push({ fieldId: field.id, phone: normalizeTicketPhone(value) });
  }
  // Stable lock order prevents concurrent creates bypassing the duplicate warning.
  for (const phone of [...new Set(phones.map(item => item.phone))].sort()) {
    await tx.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(hashtext(${phone}))`;
    if (phones.some(item => item.phone === phone && !acknowledgedFields.includes(item.fieldId)) && (await phoneMatches(tx, phone, principal)).length) {
      throw new AppException('DUPLICATE_CUSTOMER_PHONE', 'This phone is already used. Review the existing ticket or explicitly choose a different problem.', 409);
    }
  }
  return phones;
}

export async function auditPhoneTicketCreate(tx: Prisma.TransactionClient, ticketId: string, actorId: string, acknowledgedFieldIds: string[]) {
  await new AuditService(tx as any).record({ eventType: 'WORKFLOW', action: 'internal_ticket_create', actorId,
    targetType: 'INTERNAL_TICKET', targetId: ticketId, metadata: { acknowledgedPhoneFieldIds: acknowledgedFieldIds } }, tx);
}

import { HttpStatus } from '@nestjs/common';
import { ComplaintSeverity, SlaEventType, type SlaStage } from '@prisma/client';
import { AppException } from '../../core/http-kernel.js';
import type { AuditRecordInput } from '../../core/audit.service.js';
import type { SlaPolicyResponseDto } from './dto/sla-response.dto.js';
import type { SlaLifecycleEventType, SlaPolicyEscalationRecord, SlaPolicyRecord } from './sla.repository.js';

export type ResolveSlaPolicyInput = { branchId?: string | null; departmentId?: string | null; categoryId?: string | null; severity?: ComplaintSeverity; stage?: SlaStage };

export type SlaPolicyConfigAuditContext = { actorId?: string | null; correlationId?: string | null; ipAddress?: string | null; userAgent?: string | null };

export function slaPolicyResponse(policy: SlaPolicyEscalationRecord): SlaPolicyResponseDto {
  return { id: policy.id, severity: policy.severity, stage: policy.stage, branchId: policy.branchId, departmentId: policy.departmentId, categoryId: policy.categoryId, durationMinutes: policy.durationMinutes, warningPercent: policy.warningPercent, branchTimezone: policy.branchTimezone, workingCalendarMode: policy.workingCalendarMode, pausePolicy: policy.pausePolicy, escalationLevel1: policy.escalationLevel1, escalationLevel2: policy.escalationLevel2, escalationLevel3: policy.escalationLevel3, escalationLevel2AfterBreachMinutes: policy.escalationLevel2AfterBreachMinutes, escalationLevel3AfterBreachMinutes: policy.escalationLevel3AfterBreachMinutes, totalTargetMinutes: policy.totalTargetMinutes, isActive: policy.isActive };
}

export function slaPolicyConfigAudit(policy: SlaPolicyEscalationRecord, context: SlaPolicyConfigAuditContext, changedFields: string[]): AuditRecordInput {
  return { eventType: 'CONFIG', action: 'sla_policy_escalation_updated', actorId: context.actorId ?? null, branchId: null, targetType: 'sla_policy', targetId: policy.id, correlationId: context.correlationId ?? null, ipAddress: context.ipAddress ?? null, userAgent: context.userAgent ?? null, metadata: { changedFields } };
}

export function enumValue<T extends Record<string, string>>(value: unknown, options: T, field: string): T[keyof T] {
  if (typeof value === 'string' && Object.values(options).includes(value)) return value as T[keyof T];
  throw invalidPolicy(field);
}

export function lifecycleType(value: unknown): SlaLifecycleEventType {
  if (value === SlaEventType.PAUSED || value === SlaEventType.RESUMED) return value;
  throw invalidPolicy('type');
}

export function positiveInteger(value: unknown, field: string): number {
  if (Number.isInteger(value) && Number(value) > 0) return Number(value);
  throw invalidPolicy(field);
}

export function percent(value: unknown): number {
  if (Number.isInteger(value) && Number(value) > 0 && Number(value) <= 100) return Number(value);
  throw invalidPolicy('warningPercent');
}

export function timezone(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) throw invalidPolicy('branchTimezone');
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format(new Date(0));
    return value;
  } catch {
    throw invalidPolicy('branchTimezone');
  }
}

export function dateValue(value: unknown, field: string): Date {
  const date = value instanceof Date || typeof value === 'string' ? new Date(value) : null;
  if (date && !Number.isNaN(date.valueOf())) return date;
  throw invalidPolicy(field);
}

export function invalidPolicy(field: string): AppException {
  return new AppException('SLA_POLICY_MISSING', 'SLA policy is missing or invalid', HttpStatus.BAD_REQUEST, [
    { field, code: 'REQUIRED', message: `${field} is required or invalid.` },
  ]);
}

export function scopeMatches(policy: SlaPolicyRecord, input: ResolveSlaPolicyInput): boolean {
  return matches(policy.branchId, input.branchId) && matches(policy.departmentId, input.departmentId) && matches(policy.categoryId, input.categoryId);
}

export function matches(policyValue: string | null, requested: string | null | undefined): boolean {
  return policyValue === null || policyValue === requested;
}

export function specificity(policy: SlaPolicyRecord): number {
  return Number(policy.branchId !== null) + Number(policy.departmentId !== null) + Number(policy.categoryId !== null);
}

export function deadlineIdempotencyKey(complaintId: string, stage: SlaStage, policyId: string, enteredAt: string): string {
  return `sla:deadline:${complaintId}:${stage}:${policyId}:${enteredAt}`;
}

export function warningIdempotencyKey(deadlineKey: string): string {
  return `sla:warning:${deadlineKey}`;
}

export function breachIdempotencyKey(deadlineKey: string): string {
  return `sla:breach:${deadlineKey}`;
}

export function lifecycleIdempotencyKey(complaintId: string, stage: SlaStage, type: SlaLifecycleEventType, occurredAt: string): string {
  return `sla:lifecycle:${complaintId}:${stage}:${type}:${occurredAt}`;
}

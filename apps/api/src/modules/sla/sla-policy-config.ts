import type { AuditRecordInput } from '../../core/audit.service.js';
import type { SlaPolicyResponseDto } from './dto/sla-response.dto.js';
import type { SlaPolicyEscalationRecord } from './sla.repository.js';

export type SlaPolicyConfigAuditContext = { actorId?: string | null; correlationId?: string | null; ipAddress?: string | null; userAgent?: string | null };

export function slaPolicyResponse(policy: SlaPolicyEscalationRecord): SlaPolicyResponseDto {
  return { id: policy.id, severity: policy.severity, stage: policy.stage, branchId: policy.branchId, departmentId: policy.departmentId, categoryId: policy.categoryId, durationMinutes: policy.durationMinutes, warningPercent: policy.warningPercent, branchTimezone: policy.branchTimezone, workingCalendarMode: policy.workingCalendarMode, pausePolicy: policy.pausePolicy, escalationLevel1: policy.escalationLevel1, escalationLevel2: policy.escalationLevel2, escalationLevel3: policy.escalationLevel3, escalationLevel2AfterBreachMinutes: policy.escalationLevel2AfterBreachMinutes, escalationLevel3AfterBreachMinutes: policy.escalationLevel3AfterBreachMinutes, totalTargetMinutes: policy.totalTargetMinutes, isActive: policy.isActive };
}

export function slaPolicyConfigAudit(policy: SlaPolicyEscalationRecord, context: SlaPolicyConfigAuditContext, changedFields: string[]): AuditRecordInput {
  return { eventType: 'CONFIG', action: 'sla_policy_escalation_updated', actorId: context.actorId ?? null, branchId: null, targetType: 'sla_policy', targetId: policy.id, correlationId: context.correlationId ?? null, ipAddress: context.ipAddress ?? null, userAgent: context.userAgent ?? null, metadata: { changedFields } };
}

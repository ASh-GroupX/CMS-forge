import { HttpStatus, Injectable } from '@nestjs/common';
import { ComplaintSeverity, SlaEventType, SlaStage, WorkingCalendarMode } from '@prisma/client';
import { AuditService } from '../../core/audit.service.js';
import { AppException } from '../../core/http-kernel.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import type { SlaPolicyResponseDto } from './dto/sla-response.dto.js';
import type { SlaPolicyConfigInput, SlaPolicyEscalationConfigInput } from './dto/update-sla.dto.js';
import { isPausedAfterDeadline, isTerminalComplaint, isWarningDue, queueSlaBreachNotification, queueSlaWarningNotification, runSlaEscalationJob } from './sla-job-rules.js';
import type { RunSlaEscalationJobResult } from './sla-job-rules.js';
import {
  breachIdempotencyKey,
  dateValue,
  deadlineIdempotencyKey,
  enumValue,
  invalidPolicy,
  lifecycleIdempotencyKey,
  lifecycleType,
  percent,
  positiveInteger,
  scopeMatches,
  slaPolicyConfigAudit,
  slaPolicyResponse,
  specificity,
  timezone,
  warningIdempotencyKey,
  type SlaPolicyConfigAuditContext,
} from './sla-policy-config.js';
import { SlaRepository } from './sla.repository.js';
import type { SlaLifecycleEventType, SlaPolicyRecord } from './sla.repository.js';

export const DEFAULT_SLA_DURATION_MINUTES: Record<ComplaintSeverity, number> = {
  [ComplaintSeverity.CRITICAL]: 120,
  [ComplaintSeverity.HIGH]: 480,
  [ComplaintSeverity.MEDIUM]: 1440,
  [ComplaintSeverity.LOW]: 4320,
};
export type CalculateSlaDeadlineInput = { policyId?: string | null; severity?: ComplaintSeverity; stage?: SlaStage; durationMinutes?: number; warningPercent?: number; branchTimezone?: string; workingCalendarMode?: WorkingCalendarMode; enteredAt?: Date | string };

export type SlaDeadline = {
  policyId: string | null;
  severity: ComplaintSeverity;
  stage: SlaStage;
  branchTimezone: string;
  enteredAt: string;
  warningAt: string;
  dueAt: string;
};

export type ResolveSlaPolicyInput = { severity?: ComplaintSeverity; stage?: SlaStage; branchId?: string | null; departmentId?: string | null; categoryId?: string | null };

export type ResolvedSlaPolicy = Omit<SlaPolicyRecord, 'isActive' | 'updatedAt'>;

export type RecordSlaDeadlineEventInput = ResolveSlaPolicyInput & { complaintId: string; enteredAt: Date | string };
export type RecordSlaLifecycleEventInput = { complaintId: string; stage: SlaStage; type: SlaLifecycleEventType; occurredAt: Date | string };

export type SlaDeadlineEventResult = { complaintId: string; policyId: string | null; stage: SlaStage; dueAt: string | null; idempotencyKey: string };
export type SlaLifecycleEventResult = SlaDeadlineEventResult & { type: SlaLifecycleEventType; occurredAt: string };

export type RunSlaWarningJobResult = { scanned: number; created: number; skipped: number; warningIdempotencyKeys: string[] };

export type RunSlaBreachJobResult = { scanned: number; created: number; skipped: number; breachIdempotencyKeys: string[] };

export type { RunSlaEscalationJobResult };

@Injectable()
export class SlaService {
  constructor(private readonly slaRepository: SlaRepository, private readonly notificationsService?: NotificationsService, private readonly auditService?: AuditService) {}

  async resolvePolicy(input: ResolveSlaPolicyInput): Promise<ResolvedSlaPolicy> {
    const severity = enumValue(input.severity, ComplaintSeverity, 'severity');
    const stage = enumValue(input.stage, SlaStage, 'stage');
    const policies = await this.slaRepository.findActiveBySeverityAndStage(severity, stage);
    const matches = policies.filter((policy) => policy.isActive && scopeMatches(policy, input));

    matches.sort((left, right) => specificity(right) - specificity(left) || right.updatedAt.getTime() - left.updatedAt.getTime());

    const policy = matches[0];
    if (!policy) {
      throw invalidPolicy('policy');
    }

    return (({ id, severity, stage, branchId, departmentId, categoryId, durationMinutes, warningPercent, branchTimezone, workingCalendarMode, pausePolicy, escalationLevel1, escalationLevel2, escalationLevel3, escalationLevel2AfterBreachMinutes, escalationLevel3AfterBreachMinutes, totalTargetMinutes }) => ({ id, severity, stage, branchId, departmentId, categoryId, durationMinutes, warningPercent, branchTimezone, workingCalendarMode, pausePolicy, escalationLevel1, escalationLevel2, escalationLevel3, escalationLevel2AfterBreachMinutes, escalationLevel3AfterBreachMinutes, totalTargetMinutes }))(policy);
  }

  async listPolicies(): Promise<{ items: SlaPolicyResponseDto[] }> {
    let policies = await this.slaRepository.listPolicies();
    if (policies.length === 0) {
      await this.ensureDefaultPolicies();
      policies = await this.slaRepository.listPolicies();
    }
    return { items: policies.map(slaPolicyResponse) };
  }

  async ensureDefaultPolicies(): Promise<number> {
    const severities = [ComplaintSeverity.CRITICAL, ComplaintSeverity.HIGH, ComplaintSeverity.MEDIUM, ComplaintSeverity.LOW];
    const stages = [SlaStage.INTAKE, SlaStage.MANAGER_REVIEW, SlaStage.BRANCH_REVIEW, SlaStage.INVESTIGATION, SlaStage.RESOLUTION, SlaStage.CLOSURE];
    const durations: Record<ComplaintSeverity, number> = {
      [ComplaintSeverity.CRITICAL]: 120,
      [ComplaintSeverity.HIGH]: 480,
      [ComplaintSeverity.MEDIUM]: 1440,
      [ComplaintSeverity.LOW]: 4320,
    };
    let count = 0;
    for (const severity of severities) {
      for (const stage of stages) {
        const id = `sla_default_${severity}_${stage}`.toLowerCase();
        await this.slaRepository.upsertDefaultPolicy({
          id,
          severity,
          stage,
          durationMinutes: durations[severity],
          warningPercent: 80,
          branchTimezone: 'Asia/Riyadh',
          escalationLevel1: 'BRANCH_MANAGER',
          escalationLevel2: 'CR_MANAGER',
          escalationLevel3: 'ADMIN',
          escalationLevel2AfterBreachMinutes: severity === ComplaintSeverity.CRITICAL ? 30 : severity === ComplaintSeverity.HIGH ? 60 : 120,
          escalationLevel3AfterBreachMinutes: severity === ComplaintSeverity.CRITICAL ? 60 : severity === ComplaintSeverity.HIGH ? 120 : 240,
          isActive: true,
        });
        count++;
      }
    }
    return count;
  }

  async updatePolicyEscalationConfig(id: string, input: SlaPolicyEscalationConfigInput, audit: SlaPolicyConfigAuditContext = {}): Promise<SlaPolicyResponseDto> {
    return this.slaRepository.transaction(async (client) => {
      const policy = await this.slaRepository.updatePolicyEscalationConfig(id.trim(), input, client);
      await this.auditService!.record(slaPolicyConfigAudit(policy, audit, Object.keys(input)), client);
      return slaPolicyResponse(policy);
    });
  }

  async updatePolicyConfig(id: string, input: SlaPolicyConfigInput, audit: SlaPolicyConfigAuditContext = {}): Promise<SlaPolicyResponseDto> {
    return this.slaRepository.transaction(async (client) => {
      const policy = await this.slaRepository.updatePolicyConfig(id.trim(), input, client);
      await this.auditService!.record(slaPolicyConfigAudit(policy, audit, Object.keys(input)), client);
      return slaPolicyResponse(policy);
    });
  }

  calculateDeadline(input: CalculateSlaDeadlineInput): SlaDeadline {
    const severity = enumValue(input.severity, ComplaintSeverity, 'severity');
    const stage = enumValue(input.stage, SlaStage, 'stage');
    const durationMinutes = positiveInteger(input.durationMinutes, 'durationMinutes');
    const warningPercent = percent(input.warningPercent);
    const branchTimezone = timezone(input.branchTimezone);
    const enteredAt = dateValue(input.enteredAt, 'enteredAt');

    if (input.workingCalendarMode !== WorkingCalendarMode.ALWAYS_ON) {
      throw invalidPolicy('workingCalendarMode');
    }

    const enteredMs = enteredAt.getTime();
    const durationMs = durationMinutes * 60_000;
    const warningMs = Math.round((durationMs * warningPercent) / 100);

    return {
      policyId: input.policyId ?? null,
      severity,
      stage,
      branchTimezone,
      enteredAt: enteredAt.toISOString(),
      warningAt: new Date(enteredMs + warningMs).toISOString(),
      dueAt: new Date(enteredMs + durationMs).toISOString(),
    };
  }

  defaultDurationMinutes(severity: ComplaintSeverity): number {
    return DEFAULT_SLA_DURATION_MINUTES[enumValue(severity, ComplaintSeverity, 'severity')];
  }

  async recordDeadlineEvent(input: RecordSlaDeadlineEventInput): Promise<SlaDeadlineEventResult> {
    const policy = await this.resolvePolicy(input);
    const deadline = this.calculateDeadline({
      policyId: policy.id,
      severity: policy.severity,
      stage: policy.stage,
      durationMinutes: policy.durationMinutes,
      warningPercent: policy.warningPercent,
      branchTimezone: policy.branchTimezone,
      workingCalendarMode: policy.workingCalendarMode,
      enteredAt: input.enteredAt,
    });
    const idempotencyKey = deadlineIdempotencyKey(input.complaintId, policy.stage, policy.id, deadline.enteredAt);
    const event = await this.slaRepository.createDeadlineEvent({
      complaintId: input.complaintId,
      policyId: policy.id,
      stage: policy.stage,
      dueAt: new Date(deadline.dueAt),
      idempotencyKey,
    });

    return {
      complaintId: event.complaintId,
      policyId: event.policyId,
      stage: event.stage,
      dueAt: event.dueAt?.toISOString() ?? null,
      idempotencyKey: event.idempotencyKey,
    };
  }

  async recordLifecycleEvent(input: RecordSlaLifecycleEventInput): Promise<SlaLifecycleEventResult> {
    const type = lifecycleType(input.type);
    const stage = enumValue(input.stage, SlaStage, 'stage');
    const occurredAt = dateValue(input.occurredAt, 'occurredAt');
    const event = await this.slaRepository.createLifecycleEvent({
      complaintId: input.complaintId,
      type,
      stage,
      occurredAt,
      idempotencyKey: lifecycleIdempotencyKey(input.complaintId, stage, type, occurredAt.toISOString()),
    });

    return {
      complaintId: event.complaintId,
      policyId: event.policyId,
      type: lifecycleType(event.type),
      stage: event.stage,
      dueAt: event.dueAt?.toISOString() ?? null,
      occurredAt: event.occurredAt.toISOString(),
      idempotencyKey: event.idempotencyKey,
    };
  }

  async runWarningJob(now: Date | string): Promise<RunSlaWarningJobResult> {
    const nowDate = dateValue(now, 'now');
    const deadlines = await this.slaRepository.findDeadlineEventsForWarning();
    const result: RunSlaWarningJobResult = { scanned: deadlines.length, created: 0, skipped: 0, warningIdempotencyKeys: [] };

    for (const deadline of deadlines) {
      if (!deadline.dueAt || isTerminalComplaint(deadline) || isPausedAfterDeadline(deadline) || !isWarningDue(deadline, nowDate)) {
        result.skipped += 1;
        continue;
      }
      const idempotencyKey = warningIdempotencyKey(deadline.idempotencyKey);
      const created = await this.slaRepository.createWarningEvent({
        complaintId: deadline.complaintId,
        policyId: deadline.policyId,
        stage: deadline.stage,
        dueAt: deadline.dueAt,
        idempotencyKey,
      });
      if (created) {
        result.created += 1;
        result.warningIdempotencyKeys.push(idempotencyKey);
        await queueSlaWarningNotification(this.notificationsService, deadline, idempotencyKey);
      } else {
        result.skipped += 1;
      }
    }

    return result;
  }

  async runBreachJob(now: Date | string): Promise<RunSlaBreachJobResult> {
    const nowDate = dateValue(now, 'now');
    const deadlines = await this.slaRepository.findDeadlineEventsForBreach();
    const result: RunSlaBreachJobResult = { scanned: deadlines.length, created: 0, skipped: 0, breachIdempotencyKeys: [] };

    for (const deadline of deadlines) {
      if (!deadline.dueAt || deadline.dueAt.getTime() > nowDate.getTime() || isTerminalComplaint(deadline) || isPausedAfterDeadline(deadline)) {
        result.skipped += 1;
        continue;
      }
      const idempotencyKey = breachIdempotencyKey(deadline.idempotencyKey);
      const created = await this.slaRepository.createBreachEvent({
        complaintId: deadline.complaintId,
        policyId: deadline.policyId,
        stage: deadline.stage,
        dueAt: deadline.dueAt,
        idempotencyKey,
      });
      if (created) {
        result.created += 1;
        result.breachIdempotencyKeys.push(idempotencyKey);
        await queueSlaBreachNotification(this.notificationsService, deadline, idempotencyKey);
      } else {
        result.skipped += 1;
      }
    }

    return result;
  }

  async runEscalationJob(now: Date | string): Promise<RunSlaEscalationJobResult> {
    return runSlaEscalationJob(this.slaRepository, this.notificationsService, dateValue(now, 'now'));
  }
}

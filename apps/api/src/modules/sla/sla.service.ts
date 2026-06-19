import { HttpStatus, Injectable } from '@nestjs/common';
import { ComplaintSeverity, ComplaintStatus, SlaStage, WorkingCalendarMode } from '@prisma/client';
import { AppException } from '../../core/http-kernel.js';
import { SlaRepository } from './sla.repository.js';
import type { SlaDeadlineBreachRecord, SlaDeadlineWarningRecord, SlaPolicyRecord } from './sla.repository.js';

export const DEFAULT_SLA_DURATION_MINUTES: Record<ComplaintSeverity, number> = {
  [ComplaintSeverity.CRITICAL]: 120,
  [ComplaintSeverity.HIGH]: 480,
  [ComplaintSeverity.MEDIUM]: 1440,
  [ComplaintSeverity.LOW]: 4320,
};

export type CalculateSlaDeadlineInput = {
  policyId?: string | null;
  severity?: ComplaintSeverity;
  stage?: SlaStage;
  durationMinutes?: number;
  warningPercent?: number;
  branchTimezone?: string;
  workingCalendarMode?: WorkingCalendarMode;
  enteredAt?: Date | string;
};

export type SlaDeadline = {
  policyId: string | null;
  severity: ComplaintSeverity;
  stage: SlaStage;
  branchTimezone: string;
  enteredAt: string;
  warningAt: string;
  dueAt: string;
};

export type ResolveSlaPolicyInput = {
  severity?: ComplaintSeverity;
  stage?: SlaStage;
  branchId?: string | null;
  departmentId?: string | null;
  categoryId?: string | null;
};

export type ResolvedSlaPolicy = Omit<SlaPolicyRecord, 'isActive' | 'updatedAt'>;

export type RecordSlaDeadlineEventInput = ResolveSlaPolicyInput & {
  complaintId: string;
  enteredAt: Date | string;
};

export type SlaDeadlineEventResult = {
  complaintId: string;
  policyId: string | null;
  stage: SlaStage;
  dueAt: string | null;
  idempotencyKey: string;
};

export type RunSlaWarningJobResult = {
  scanned: number;
  created: number;
  skipped: number;
  warningIdempotencyKeys: string[];
};

export type RunSlaBreachJobResult = { scanned: number; created: number; skipped: number; breachIdempotencyKeys: string[] };

@Injectable()
export class SlaService {
  constructor(private readonly slaRepository: SlaRepository) {}

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

    return {
      id: policy.id,
      severity: policy.severity,
      stage: policy.stage,
      branchId: policy.branchId,
      departmentId: policy.departmentId,
      categoryId: policy.categoryId,
      durationMinutes: policy.durationMinutes,
      warningPercent: policy.warningPercent,
      branchTimezone: policy.branchTimezone,
      workingCalendarMode: policy.workingCalendarMode,
    };
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

  async runWarningJob(now: Date | string): Promise<RunSlaWarningJobResult> {
    const nowDate = dateValue(now, 'now');
    const deadlines = await this.slaRepository.findDeadlineEventsForWarning();
    const result: RunSlaWarningJobResult = { scanned: deadlines.length, created: 0, skipped: 0, warningIdempotencyKeys: [] };

    for (const deadline of deadlines) {
      if (!deadline.dueAt || !isWarningDue(deadline, nowDate)) {
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
      if (!deadline.dueAt || deadline.dueAt.getTime() > nowDate.getTime() || isTerminalComplaint(deadline)) {
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
      } else {
        result.skipped += 1;
      }
    }

    return result;
  }
}

function enumValue<T extends Record<string, string>>(value: unknown, options: T, field: string): T[keyof T] {
  if (typeof value === 'string' && Object.values(options).includes(value)) {
    return value as T[keyof T];
  }
  throw invalidPolicy(field);
}

function positiveInteger(value: unknown, field: string): number {
  if (Number.isInteger(value) && Number(value) > 0) {
    return Number(value);
  }
  throw invalidPolicy(field);
}

function percent(value: unknown): number {
  if (Number.isInteger(value) && Number(value) > 0 && Number(value) <= 100) {
    return Number(value);
  }
  throw invalidPolicy('warningPercent');
}

function timezone(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw invalidPolicy('branchTimezone');
  }

  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format(new Date(0));
    return value;
  } catch {
    throw invalidPolicy('branchTimezone');
  }
}

function dateValue(value: unknown, field: string): Date {
  const date = value instanceof Date || typeof value === 'string' ? new Date(value) : null;
  if (date && !Number.isNaN(date.valueOf())) {
    return date;
  }
  throw invalidPolicy(field);
}

function invalidPolicy(field: string): AppException {
  return new AppException('SLA_POLICY_MISSING', 'SLA policy is missing or invalid', HttpStatus.BAD_REQUEST, [
    { field, code: 'REQUIRED', message: `${field} is required or invalid.` },
  ]);
}

function scopeMatches(policy: SlaPolicyRecord, input: ResolveSlaPolicyInput): boolean {
  return matches(policy.branchId, input.branchId) && matches(policy.departmentId, input.departmentId) && matches(policy.categoryId, input.categoryId);
}

function matches(policyValue: string | null, requested: string | null | undefined): boolean {
  return policyValue === null || policyValue === requested;
}

function specificity(policy: SlaPolicyRecord): number {
  return Number(policy.branchId !== null) + Number(policy.departmentId !== null) + Number(policy.categoryId !== null);
}

function deadlineIdempotencyKey(complaintId: string, stage: SlaStage, policyId: string, enteredAt: string): string {
  return `sla:deadline:${complaintId}:${stage}:${policyId}:${enteredAt}`;
}

function warningIdempotencyKey(deadlineKey: string): string {
  return `sla:warning:${deadlineKey}`;
}

function breachIdempotencyKey(deadlineKey: string): string { return `sla:breach:${deadlineKey}`; }

function isWarningDue(deadline: SlaDeadlineWarningRecord, now: Date): boolean {
  if (!deadline.dueAt || !deadline.policy) return false;
  if (!Number.isInteger(deadline.policy.durationMinutes) || deadline.policy.durationMinutes <= 0) return false;
  if (!Number.isInteger(deadline.policy.warningPercent) || deadline.policy.warningPercent <= 0 || deadline.policy.warningPercent > 100) return false;
  const remainingPercent = 100 - deadline.policy.warningPercent;
  const warningAt = deadline.dueAt.getTime() - Math.round(deadline.policy.durationMinutes * 60_000 * remainingPercent / 100);
  return warningAt <= now.getTime();
}

function isTerminalComplaint(deadline: SlaDeadlineBreachRecord): boolean { return deadline.complaint.status === ComplaintStatus.CLOSED || deadline.complaint.status === ComplaintStatus.REJECTED; }

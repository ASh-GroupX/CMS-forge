export interface DayRuleInput {
  dayOfWeek: number;
  isOpen: boolean;
  startTime: string;
  endTime: string;
  maxDailyAppointments: number;
  maxPerHour: number;
  maxPerSlot: number;
  slotDurationMinutes?: number;
}

export class UpdateBranchBookingRulesDto {
  branchId!: string;
  rules!: DayRuleInput[];
}

export function parseUpdateBranchBookingRulesBody(input: unknown): UpdateBranchBookingRulesDto {
  if (!input || typeof input !== 'object') {
    throw new Error('Rules payload must be an object');
  }
  const body = input as Record<string, unknown>;
  const branchId = String(body.branchId ?? '').trim();
  if (!branchId) throw new Error('branchId is required');

  if (!Array.isArray(body.rules)) {
    throw new Error('rules must be an array of day rules');
  }

  const rules: DayRuleInput[] = body.rules.map((item, idx) => {
    if (!item || typeof item !== 'object') throw new Error(`Invalid rule at index ${idx}`);
    const r = item as Record<string, unknown>;
    const dayOfWeek = Number(r.dayOfWeek);
    if (isNaN(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
      throw new Error(`dayOfWeek must be between 0 (Sunday) and 6 (Saturday) at index ${idx}`);
    }
    const isOpen = Boolean(r.isOpen);
    const startTime = String(r.startTime ?? '08:00').trim();
    const endTime = String(r.endTime ?? '18:00').trim();
    const maxDailyAppointments = Number(r.maxDailyAppointments) >= 0 ? Number(r.maxDailyAppointments) : 24;
    const maxPerHour = Number(r.maxPerHour) > 0 ? Number(r.maxPerHour) : 3;
    const maxPerSlot = Number(r.maxPerSlot) > 0 ? Number(r.maxPerSlot) : 1;
    const slotDurationMinutes = Number(r.slotDurationMinutes) > 0 ? Number(r.slotDurationMinutes) : 15;

    return {
      dayOfWeek,
      isOpen,
      startTime,
      endTime,
      maxDailyAppointments,
      maxPerHour,
      maxPerSlot,
      slotDurationMinutes,
    };
  });

  return { branchId, rules };
}

import { ComplaintSeverity, PrismaClient, SlaStage } from '@prisma/client';

// Default SLA policies. One global (unscoped) policy per severity x stage so every
// forward complaint transition resolves a deadline out of the box; branch /
// department / category-scoped policies configured via /sla/policies override
// these by specificity. Idempotent upserts keyed by a stable deterministic id —
// safe to run repeatedly. Durations mirror SlaService.DEFAULT_SLA_DURATION_MINUTES.

const DURATION_MINUTES: Record<ComplaintSeverity, number> = {
  [ComplaintSeverity.CRITICAL]: 120,
  [ComplaintSeverity.HIGH]: 480,
  [ComplaintSeverity.MEDIUM]: 1440,
  [ComplaintSeverity.LOW]: 4320,
};

export async function seedSlaPolicies(prisma: PrismaClient): Promise<number> {
  let count = 0;
  for (const severity of Object.values(ComplaintSeverity)) {
    for (const stage of Object.values(SlaStage)) {
      const id = `sla_default_${severity}_${stage}`.toLowerCase();
      await prisma.slaPolicy.upsert({
        where: { id },
        update: {},
        create: {
          id,
          severity,
          stage,
          durationMinutes: DURATION_MINUTES[severity],
          warningPercent: 80,
          branchTimezone: 'Asia/Riyadh',
          escalationLevel1: 'BRANCH_MANAGER',
          isActive: true,
        },
      });
      count += 1;
    }
  }
  return count;
}

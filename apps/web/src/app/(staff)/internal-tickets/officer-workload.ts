import type { Locale } from '../../../i18n/staff-shell';

export type OfficerFilter = 'all' | 'active' | 'free';

const finishedStatuses = new Set(['RESOLVED', 'CLOSED', 'REJECTED']);

export function officerWorkload(team: any[], tickets: any[], filter: OfficerFilter, locale: Locale) {
  const counts = new Map<string, number>();
  for (const ticket of tickets) {
    if (!ticket.assignedEmployeeId || finishedStatuses.has(ticket.status)) continue;
    counts.set(ticket.assignedEmployeeId, (counts.get(ticket.assignedEmployeeId) ?? 0) + 1);
  }

  const collator = new Intl.Collator(locale);
  return team
    .map((member) => ({ member, activeCount: counts.get(member.id) ?? 0 }))
    .filter(({ activeCount }) => filter === 'all' || (filter === 'active' ? activeCount > 0 : activeCount === 0))
    .sort((left, right) => right.activeCount - left.activeCount || collator.compare(
      locale === 'ar' ? left.member.nameAr || left.member.nameEn || left.member.name || '' : left.member.nameEn || left.member.name || '',
      locale === 'ar' ? right.member.nameAr || right.member.nameEn || right.member.name || '' : right.member.nameEn || right.member.name || '',
    ));
}

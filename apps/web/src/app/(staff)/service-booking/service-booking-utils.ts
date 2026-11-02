import type { ServiceAppointment } from '../../../lib/staff-service-bookings-api';

/**
 * Returns today's date formatted as YYYY-MM-DD in the specified timezone (default Asia/Amman).
 */
export function getTodayDateString(timeZone: string = 'Asia/Amman'): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  } catch {
    return new Date().toLocaleDateString('en-CA');
  }
}

/**
 * Returns the current hour and minute in the specified timezone.
 */
export function getNowTimeParts(timeZone: string = 'Asia/Amman'): { hour: number; minute: number } {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: 'numeric',
      minute: 'numeric',
      hourCycle: 'h23',
    }).formatToParts(new Date());
    const hourVal = parts.find((p) => p.type === 'hour')?.value;
    const minVal = parts.find((p) => p.type === 'minute')?.value;
    return {
      hour: hourVal !== undefined ? Number(hourVal) : new Date().getHours(),
      minute: minVal !== undefined ? Number(minVal) : new Date().getMinutes(),
    };
  } catch {
    const d = new Date();
    return { hour: d.getHours(), minute: d.getMinutes() };
  }
}

/**
 * Checks whether an appointment matches a given service center branch.
 */
export function matchesBranch(
  apt: ServiceAppointment,
  branch: { id: string; code?: string },
): boolean {
  if (!branch) return false;
  const targetId = apt.branchId || apt.serviceCenterId || '';
  if (targetId === branch.id || (branch.code && targetId === branch.code)) return true;
  if (
    (branch.id === 'center_main' || branch.code === 'MAIN_CENTER') &&
    (targetId === 'center_main' || targetId === 'MAIN_CENTER')
  ) {
    return true;
  }
  if (
    (branch.id === 'center_north' || branch.code === 'NORTH_CENTER') &&
    (targetId === 'center_north' || targetId === 'NORTH_CENTER')
  ) {
    return true;
  }
  return false;
}

/**
 * Returns CSS styling classes corresponding to appointment status.
 */
export function appointmentStatusStyle(status: string): string {
  switch (status) {
    case 'CONFIRMED':
      return 'border-sky-500/30 bg-sky-500/10 text-sky-950 dark:text-sky-100';
    case 'IN_SERVICE':
      return 'border-status-warning-border bg-status-warning-bg text-status-warning ring-1 ring-status-warning-border';
    case 'COMPLETED':
      return 'border-status-success-border bg-status-success-bg text-status-success';
    case 'CANCELLED':
      return 'border-status-error-border bg-status-error-bg text-status-error line-through';
    case 'NO_SHOW':
      return 'border-purple-500/20 bg-purple-500/5 text-purple-800 dark:text-purple-200';
    default: // BOOKED
      return 'border-brand/30 bg-brand/10 text-brand dark:text-brand-foreground';
  }
}

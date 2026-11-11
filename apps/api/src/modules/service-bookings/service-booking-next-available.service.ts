import { BadRequestException, Injectable } from '@nestjs/common';
import { ServiceBookingsService } from './service-bookings.service.js';
import { UserBookingRulesService } from './user-booking-rules.service.js';
import { getAmmanNow } from './service-bookings.utils.js';

export type NextAvailableSlot = {
  branchId: string;
  branchNameEn: string;
  branchNameAr: string;
  date: string;
  time: string;
  bookedCount: number;
  maxPerSlot: number;
  remainingInSlot: number;
};

@Injectable()
export class ServiceBookingNextAvailableService {
  constructor(
    private readonly bookings: ServiceBookingsService,
    private readonly userRules: UserBookingRulesService,
  ) {}

  async nextThree(branchId: string | undefined, actorId: string | null | undefined, roleCode?: string, now = new Date()): Promise<NextAvailableSlot[]> {
    await this.userRules.checkPermission(actorId, roleCode, 'canViewBookings');
    const centers = await this.bookings.getServiceCenters(true);
    const selected = !branchId || branchId === 'ALL' ? centers : centers.filter((center) => center.id === branchId);
    if (branchId && branchId !== 'ALL' && selected.length === 0) throw new BadRequestException('Unknown active service center');
    const current = getAmmanNow(now);
    const baseDay = Date.parse(`${current.date}T00:00:00Z`);
    const suggestions: NextAvailableSlot[] = [];

    for (let offset = 0; offset < 30 && suggestions.length < 3; offset += 1) {
      const date = new Date(baseDay + offset * 86400000).toISOString().slice(0, 10);
      const days = await Promise.all(selected.map(async (center) => ({ center,
        availability: await this.bookings.getSlotAvailability(center.id, date),
      })));
      const candidates = days.flatMap(({ center, availability }) => availability.slots
        .filter((slot) => availability.isOpen && availability.bookedDailyCount < availability.maxDailyAppointments
          && slot.remainingInSlot > 0 && slot.remainingInHour > 0
          && (offset > 0 || slot.slot >= current.time))
        .map((slot): NextAvailableSlot => ({
          branchId: center.id, branchNameEn: center.nameEn, branchNameAr: center.nameAr,
          date, time: slot.slot, bookedCount: slot.bookedCount,
          maxPerSlot: slot.maxPerSlot, remainingInSlot: Math.min(slot.remainingInSlot,
            slot.remainingInHour, availability.maxDailyAppointments - availability.bookedDailyCount),
        })));
      candidates.sort((a, b) => a.time.localeCompare(b.time) || a.branchNameEn.localeCompare(b.branchNameEn));
      suggestions.push(...candidates.slice(0, 3 - suggestions.length));
    }
    return suggestions;
  }
}

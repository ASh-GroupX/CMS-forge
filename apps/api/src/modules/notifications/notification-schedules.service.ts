import { Injectable } from '@nestjs/common';
import { NotificationScheduleRepository } from './notification-schedule.repository.js';

@Injectable()
export class NotificationSchedulesService {
  constructor(private readonly repository: NotificationScheduleRepository) {}

  cancelServiceBookingReminder(appointmentId: string): Promise<number> {
    return this.repository.cancelQueuedServiceBookingSms(appointmentId);
  }

  cancelAllServiceBookingReminders(): Promise<number> {
    return this.repository.cancelAllQueuedServiceBookingSms();
  }

  recentServiceBookingReminders() {
    return this.repository.listRecentServiceBookingSms();
  }
}

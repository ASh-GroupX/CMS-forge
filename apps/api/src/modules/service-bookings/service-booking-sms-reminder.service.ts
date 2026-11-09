import { Injectable } from '@nestjs/common';
import { NotificationChannel, ServiceAppointmentStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service.js';
import { NotificationSchedulesService } from '../notifications/notification-schedules.service.js';
import type { AppointmentRecord } from './service-bookings.repository.js';
import { ServiceBookingSmsSettingsRepository } from './service-booking-sms-settings.repository.js';
import { ServiceBookingSmsReminderRepository } from './service-booking-sms-reminder.repository.js';

@Injectable()
export class ServiceBookingSmsReminderService {
  constructor(
    private readonly notifications: NotificationsService,
    private readonly notificationSchedules: NotificationSchedulesService,
    private readonly settings: ServiceBookingSmsSettingsRepository,
    private readonly repository: ServiceBookingSmsReminderRepository,
  ) {}

  async refreshUpcoming(now = new Date()): Promise<void> {
    const appointments = await this.repository.findUpcomingAppointments(now);
    const settings = await this.settings.read();
    for (const appointment of appointments) {
      if (appointmentTime(appointment) <= now) await this.notificationSchedules.cancelServiceBookingReminder(appointment.id);
      else await this.sync(appointment, appointment.updatedAt.toISOString(), settings);
    }
  }

  async sync(appointment: AppointmentRecord, revision: string, currentSettings?: Awaited<ReturnType<ServiceBookingSmsSettingsRepository['read']>>): Promise<void> {
    await this.notificationSchedules.cancelServiceBookingReminder(appointment.id);
    if (appointment.status !== ServiceAppointmentStatus.BOOKED && appointment.status !== ServiceAppointmentStatus.CONFIRMED) return;
    const setting = currentSettings ?? await this.settings.read();
    if (!setting.enabled || !setting.senderNumber || !setting.messageTemplate) return;
    const to = jordanSmsNumber(appointment.customerPhone);
    if (!to) return;

    const appointmentAt = appointmentTime(appointment);
    const dueAt = new Date(Math.max(Date.now(), appointmentAt.getTime() - setting.leadHours * 60 * 60 * 1000));
    const center = appointment.serviceCenter?.nameEn || appointment.branch?.nameEn || appointment.serviceCenterId;
    const textBody = render(setting.messageTemplate, {
      customerName: appointment.customerName,
      date: appointment.date.toISOString().slice(0, 10),
      time: appointment.startTime,
      serviceCenter: center,
      maintenanceType: appointment.maintenanceTypeName,
      referenceNumber: appointment.referenceNumber,
    });
    await this.notifications.queueInternal({
      channel: NotificationChannel.SMS,
      serviceAppointmentId: appointment.id,
      scheduledAt: dueAt,
      templateCode: 'service_booking.reminder',
      locale: 'en',
      idempotencyKey: `service-booking-reminder:${appointment.id}:${revision}:${setting.updatedAt.toISOString()}`,
      payload: { to, from: setting.senderNumber, textBody },
    });
  }
}

function appointmentTime(appointment: Pick<AppointmentRecord, 'date' | 'startTime'>): Date {
  return new Date(`${appointment.date.toISOString().slice(0, 10)}T${appointment.startTime}:00+03:00`);
}

function render(template: string, values: Record<string, string>): string {
  return template.replace(/\{\{\s*([A-Za-z0-9_.-]+)\s*\}\}/g, (_match, key: string) => values[key] ?? '');
}

function jordanSmsNumber(value: string): string | null {
  const normalized = value.trim().replace(/[\s()-]/g, '');
  if (/^\+[1-9]\d{7,14}$/.test(normalized)) return normalized;
  if (/^00[1-9]\d{7,14}$/.test(normalized)) return `+${normalized.slice(2)}`;
  if (/^0[7][0-9]{8}$/.test(normalized)) return `+962${normalized.slice(1)}`;
  return null;
}

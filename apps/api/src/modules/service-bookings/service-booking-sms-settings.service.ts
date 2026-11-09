import { HttpStatus, Injectable } from '@nestjs/common';
import { AuditService } from '../../core/audit.service.js';
import { AppException } from '../../core/http-kernel.js';
import { UserBookingRulesService } from './user-booking-rules.service.js';
import { ServiceBookingSmsSettingsRepository } from './service-booking-sms-settings.repository.js';
import { NotificationSchedulesService } from '../notifications/notification-schedules.service.js';
import { ServiceBookingSmsReminderService } from './service-booking-sms-reminder.service.js';

@Injectable()
export class ServiceBookingSmsSettingsService {
  constructor(
    private readonly repository: ServiceBookingSmsSettingsRepository,
    private readonly audit: AuditService,
    private readonly userRules: UserBookingRulesService,
    private readonly notificationSchedules?: NotificationSchedulesService,
    private readonly reminderService?: ServiceBookingSmsReminderService,
  ) {}

  async read(actorId: string | null, roleCode?: string) {
    await this.userRules.checkPermission(actorId, roleCode, 'canManageSettings');
    const { updatedById: _updatedById, ...settings } = await this.repository.read();
    const deliveries = await this.notificationSchedules?.recentServiceBookingReminders() ?? [];
    return { ...settings, providerReady: false, providerMode: 'test' as const, deliveries };
  }

  async update(input: unknown, actorId: string | null, roleCode?: string) {
    await this.userRules.checkPermission(actorId, roleCode, 'canManageSettings');
    if (!actorId) throw invalid('actorId', 'An authenticated Admin is required');
    const data = parseSettings(input);
    const updated = await this.repository.transaction(async (client) => {
      const setting = await client.serviceBookingSmsSetting.upsert({
        where: { id: 'global' }, create: { id: 'global', ...data, updatedById: actorId },
        update: { ...data, updatedById: actorId },
      });
      await this.audit.record({
        eventType: 'CONFIG', action: 'service_booking_sms_settings_changed', actorId,
        targetType: 'ServiceBookingSmsSetting', targetId: setting.id,
        metadata: { enabled: data.enabled, leadHours: data.leadHours, senderNumber: data.senderNumber, messageUpdated: true },
      }, client);
      return setting;
    });
    await this.reminderService?.refreshUpcoming();
    const deliveries = await this.notificationSchedules?.recentServiceBookingReminders() ?? [];
    const { updatedById: _updatedById, ...settings } = updated;
    return { ...settings, providerReady: false, providerMode: 'test' as const, deliveries };
  }
}

function parseSettings(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw invalid('body', 'Invalid SMS reminder settings');
  const value = input as Record<string, unknown>;
  const senderNumber = typeof value.senderNumber === 'string' ? value.senderNumber.trim() : '';
  const messageTemplate = typeof value.messageTemplate === 'string' ? value.messageTemplate.trim() : '';
  if (typeof value.enabled !== 'boolean') throw invalid('enabled', 'Enabled must be true or false');
  if (!Number.isInteger(value.leadHours) || Number(value.leadHours) < 1 || Number(value.leadHours) > 720) throw invalid('leadHours', 'Lead time must be from 1 to 720 hours');
  if (senderNumber && !/^\+[1-9]\d{7,14}$/.test(senderNumber)) throw invalid('senderNumber', 'Use an international phone number');
  if (messageTemplate.length > 1000) throw invalid('messageTemplate', 'Message must be 1000 characters or less');
  if (value.enabled && (!senderNumber || !messageTemplate)) throw invalid('messageTemplate', 'Sender number and message are required when enabled');
  return { enabled: value.enabled, leadHours: Number(value.leadHours), senderNumber, messageTemplate };
}

function invalid(field: string, message: string) {
  return new AppException('VALIDATION_FAILED', 'Invalid service booking SMS settings', HttpStatus.BAD_REQUEST, [
    { field, code: 'INVALID', message },
  ]);
}

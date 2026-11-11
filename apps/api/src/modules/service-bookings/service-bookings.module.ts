import { Module } from '@nestjs/common';
import { AuditService } from '../../core/audit.service.js';
import { PermissionGuard, SESSION_AUTH_SERVICE, SessionAuthGuard } from '../../core/auth.guard.js';
import { CsrfGuard } from '../../core/csrf.guard.js';
import { PrismaService } from '../../core/http-kernel.js';
import { AuthModule } from '../auth/auth.module.js';
import { AuthService } from '../auth/auth.service.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { ServiceBookingsController } from './service-bookings.controller.js';
import { ServiceBookingsRepository } from './service-bookings.repository.js';
import { ServiceBookingsService } from './service-bookings.service.js';
import { UserBookingRulesService } from './user-booking-rules.service.js';
import { ServiceBookingSmsSettingsRepository } from './service-booking-sms-settings.repository.js';
import { ServiceBookingSmsSettingsService } from './service-booking-sms-settings.service.js';
import { ServiceBookingSmsReminderService } from './service-booking-sms-reminder.service.js';
import { ServiceBookingSmsReminderRepository } from './service-booking-sms-reminder.repository.js';
import { ServiceBookingsExportRepository } from './service-bookings.export.repository.js';
import { ServiceBookingsExportService } from './service-bookings.export.service.js';
import { ServiceBookingNextAvailableService } from './service-booking-next-available.service.js';

@Module({
  imports: [AuthModule, NotificationsModule],
  controllers: [ServiceBookingsController],
  providers: [
    PrismaService,
    AuditService,
    ServiceBookingsRepository,
    ServiceBookingsService,
    UserBookingRulesService,
    ServiceBookingSmsSettingsRepository,
    ServiceBookingSmsSettingsService,
    ServiceBookingSmsReminderService,
    ServiceBookingSmsReminderRepository,
    ServiceBookingsExportRepository,
    ServiceBookingsExportService,
    ServiceBookingNextAvailableService,
    {
      provide: SESSION_AUTH_SERVICE,
      inject: [AuthService],
      useFactory: (authService: AuthService) => authService,
    },
    SessionAuthGuard,
    PermissionGuard,
    CsrfGuard,
  ],
  exports: [ServiceBookingsService, ServiceBookingsRepository, ServiceBookingsExportService, UserBookingRulesService],
})
export class ServiceBookingsModule {}


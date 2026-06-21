import { Module } from '@nestjs/common';
import { AuditService } from '../../core/audit.service.js';
import { PrismaService } from '../../core/http-kernel.js';
import {
  InMemoryLoginRateLimitStore,
  LOGIN_RATE_LIMIT_STORE,
  PortalSubmissionRateLimitGuard,
  PortalTrackingOtpRateLimitGuard,
} from '../../core/rate-limit.guard.js';
import { ComplaintsModule } from '../complaints/complaints.module.js';
import { ComplaintsService } from '../complaints/complaints.service.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { PortalController } from './portal.controller.js';
import { PortalRepository } from './portal.repository.js';
import { PortalService } from './portal.service.js';

@Module({
  imports: [ComplaintsModule, NotificationsModule],
  controllers: [PortalController],
  providers: [
    PrismaService,
    { provide: AuditService, inject: [PrismaService], useFactory: (prisma: PrismaService) => new AuditService(prisma) },
    { provide: LOGIN_RATE_LIMIT_STORE, useClass: InMemoryLoginRateLimitStore },
    PortalSubmissionRateLimitGuard,
    PortalTrackingOtpRateLimitGuard,
    {
      provide: PortalRepository,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PortalRepository(prisma),
    },
    {
      provide: PortalService,
      inject: [ComplaintsService, PortalRepository, NotificationsService, AuditService],
      useFactory: (
        complaints: ComplaintsService,
        repository: PortalRepository,
        notifications: NotificationsService,
        audit: AuditService,
      ) => new PortalService(complaints, repository, notifications, audit),
    },
  ],
  exports: [PortalService],
})
export class PortalModule {}

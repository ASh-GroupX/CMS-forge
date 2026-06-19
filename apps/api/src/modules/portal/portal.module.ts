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
import { NotificationsModule } from '../notifications/notifications.module.js';
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
    PortalRepository,
    PortalService,
  ],
  exports: [PortalService],
})
export class PortalModule {}

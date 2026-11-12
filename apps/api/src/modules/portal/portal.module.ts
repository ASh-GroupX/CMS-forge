import { forwardRef, Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuditService } from '../../core/audit.service.js';
import { RbacGuard, SESSION_AUTH_SERVICE, SessionAuthGuard } from '../../core/auth.guard.js';
import { CsrfGuard } from '../../core/csrf.guard.js';
import { AuthModule } from '../auth/auth.module.js';
import { AuthService } from '../auth/auth.service.js';
import { PrismaService } from '../../core/http-kernel.js';
import {
  InMemoryLoginRateLimitStore,
  LOGIN_RATE_LIMIT_STORE,
  PortalSubmissionRateLimitGuard,
  PortalTrackingOtpRateLimitGuard,
} from '../../core/rate-limit.guard.js';
import { ComplaintsModule } from '../complaints/complaints.module.js';
import { ComplaintsService } from '../complaints/complaints.service.js';
import { AttachmentsModule } from '../attachments/attachments.module.js';
import { AttachmentsService } from '../attachments/attachments.service.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { PortalController } from './portal.controller.js';
import { PortalRepository } from './portal.repository.js';
import { PortalService } from './portal.service.js';
import { PortalIntakeModule } from '../portal-intake/portal-intake.module.js';
import { PortalIntakeService } from '../portal-intake/portal-intake.service.js';

@Module({
  imports: [AuthModule, PortalIntakeModule, ComplaintsModule, NotificationsModule, forwardRef(() => AttachmentsModule)],
  controllers: [PortalController],
  providers: [
    PrismaService,
    { provide: SESSION_AUTH_SERVICE, inject: [AuthService], useFactory: (auth: AuthService) => auth },
    SessionAuthGuard,
    { provide: RbacGuard, inject: [Reflector, AuditService], useFactory: (reflector: Reflector, audit: AuditService) => new RbacGuard(reflector, audit) },
    CsrfGuard,
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
      inject: [ComplaintsService, PortalRepository, NotificationsService, AuditService, AttachmentsService, PortalIntakeService],
      useFactory: (
        complaints: ComplaintsService,
        repository: PortalRepository,
        notifications: NotificationsService,
        audit: AuditService,
        attachments: AttachmentsService,
        configuration: PortalIntakeService,
      ) => new PortalService(complaints, repository, notifications, audit, attachments, configuration),
    },
  ],
  exports: [PortalService],
})
export class PortalModule {}

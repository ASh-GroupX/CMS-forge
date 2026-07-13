import { Module } from '@nestjs/common';
import { AuditService } from '../../core/audit.service.js';
import { PermissionGuard, RbacGuard, SESSION_AUTH_SERVICE, SessionAuthGuard } from '../../core/auth.guard.js';
import { CsrfGuard } from '../../core/csrf.guard.js';
import { PrismaService } from '../../core/http-kernel.js';
import { AuthModule } from '../auth/auth.module.js';
import { AuthService } from '../auth/auth.service.js';
import { IntegrationsModule } from '../integrations/integrations.module.js';
import { IntegrationsService } from '../integrations/integrations.service.js';
import { NotificationsController } from './notifications.controller.js';
import { NotificationsRepository } from './notifications.repository.js';
import { NotificationDigestRepository } from './notification-digest.repository.js';
import { NotificationsService } from './notifications.service.js';

@Module({
  imports: [AuthModule, IntegrationsModule],
  controllers: [NotificationsController],
  providers: [
    PrismaService,
    AuditService,
    {
      provide: NotificationsRepository,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new NotificationsRepository(prisma),
    },
    NotificationDigestRepository,
    {
      provide: NotificationsService,
      inject: [NotificationsRepository, IntegrationsService, AuditService, NotificationDigestRepository],
      useFactory: (repository: NotificationsRepository, integrations: IntegrationsService, audit: AuditService, digest: NotificationDigestRepository) => new NotificationsService(repository, integrations, audit, digest),
    },
    {
      provide: SESSION_AUTH_SERVICE,
      inject: [AuthService],
      useFactory: (authService: AuthService) => authService,
    },
    SessionAuthGuard,
    PermissionGuard,
    RbacGuard,
    CsrfGuard,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}

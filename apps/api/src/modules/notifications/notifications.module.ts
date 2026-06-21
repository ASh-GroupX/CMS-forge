import { Module } from '@nestjs/common';
import { AuditService } from '../../core/audit.service.js';
import { RbacGuard, SESSION_AUTH_SERVICE, SessionAuthGuard } from '../../core/auth.guard.js';
import { CsrfGuard } from '../../core/csrf.guard.js';
import { PrismaService } from '../../core/http-kernel.js';
import { AuthModule } from '../auth/auth.module.js';
import { AuthService } from '../auth/auth.service.js';
import { IntegrationsModule } from '../integrations/integrations.module.js';
import { IntegrationsService } from '../integrations/integrations.service.js';
import { NotificationsController } from './notifications.controller.js';
import { NotificationsRepository } from './notifications.repository.js';
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
    {
      provide: NotificationsService,
      inject: [NotificationsRepository, IntegrationsService, AuditService],
      useFactory: (repository: NotificationsRepository, integrations: IntegrationsService, audit: AuditService) => new NotificationsService(repository, integrations, audit),
    },
    {
      provide: SESSION_AUTH_SERVICE,
      inject: [AuthService],
      useFactory: (authService: AuthService) => authService,
    },
    SessionAuthGuard,
    RbacGuard,
    CsrfGuard,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}

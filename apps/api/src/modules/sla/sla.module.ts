import { Module } from '@nestjs/common';
import { AuditService } from '../../core/audit.service.js';
import { PermissionGuard, SESSION_AUTH_SERVICE, SessionAuthGuard } from '../../core/auth.guard.js';
import { CsrfGuard } from '../../core/csrf.guard.js';
import { PrismaService } from '../../core/http-kernel.js';
import { AuthModule } from '../auth/auth.module.js';
import { AuthService } from '../auth/auth.service.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { SlaController } from './sla.controller.js';
import { SlaRepository } from './sla.repository.js';
import { SlaService } from './sla.service.js';

@Module({
  imports: [AuthModule, NotificationsModule],
  controllers: [SlaController],
  providers: [
    PrismaService,
    AuditService,
    SlaRepository,
    {
      provide: SlaService,
      inject: [SlaRepository, NotificationsService, AuditService],
      useFactory: (repository: SlaRepository, notifications: NotificationsService, audit: AuditService) => new SlaService(repository, notifications, audit),
    },
    {
      provide: SESSION_AUTH_SERVICE,
      inject: [AuthService],
      useFactory: (authService: AuthService) => authService,
    },
    SessionAuthGuard,
    PermissionGuard,
    CsrfGuard,
  ],
  exports: [SlaService],
})
export class SlaModule {}

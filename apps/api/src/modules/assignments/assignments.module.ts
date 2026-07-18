import { Module } from '@nestjs/common';
import { AuditService } from '../../core/audit.service.js';
import { SESSION_AUTH_SERVICE, SessionAuthGuard } from '../../core/auth.guard.js';
import { PrismaService } from '../../core/http-kernel.js';
import { AuthModule } from '../auth/auth.module.js';
import { AuthService } from '../auth/auth.service.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { AssignmentsController } from './assignments.controller.js';
import { AssignmentsRepository } from './assignments.repository.js';
import { AssignmentsService } from './assignments.service.js';

@Module({
  imports: [AuthModule, NotificationsModule],
  controllers: [AssignmentsController],
  providers: [
    PrismaService,
    AuditService,
    AssignmentsRepository,
    {
      provide: AssignmentsService,
      inject: [AssignmentsRepository, AuditService, NotificationsService],
      useFactory: (repository: AssignmentsRepository, audit: AuditService, notifications: NotificationsService) => new AssignmentsService(repository, audit, notifications),
    },
    { provide: SESSION_AUTH_SERVICE, inject: [AuthService], useFactory: (authService: AuthService) => authService },
    SessionAuthGuard,
  ],
  exports: [AssignmentsService],
})
export class AssignmentsModule {}

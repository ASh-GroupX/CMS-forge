import { Module } from '@nestjs/common';
import { AuditService } from '../../core/audit.service.js';
import { RbacGuard, SESSION_AUTH_SERVICE, SessionAuthGuard } from '../../core/auth.guard.js';
import { CsrfGuard } from '../../core/csrf.guard.js';
import { PrismaService } from '../../core/http-kernel.js';
import { AuthModule } from '../auth/auth.module.js';
import { AuthService } from '../auth/auth.service.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { ComplaintsController } from './complaints.controller.js';
import { ComplaintFormOptionsService } from './complaint-form-options.service.js';
import { ComplaintsRepository } from './complaints.repository.js';
import { ComplaintsService } from './complaints.service.js';

@Module({
  imports: [AuthModule, NotificationsModule],
  controllers: [ComplaintsController],
  providers: [
    PrismaService,
    AuditService,
    ComplaintFormOptionsService,
    ComplaintsRepository,
    ComplaintsService,
    {
      provide: SESSION_AUTH_SERVICE,
      inject: [AuthService],
      useFactory: (authService: AuthService) => authService,
    },
    SessionAuthGuard,
    RbacGuard,
    CsrfGuard,
  ],
  exports: [ComplaintsService],
})
export class ComplaintsModule {}

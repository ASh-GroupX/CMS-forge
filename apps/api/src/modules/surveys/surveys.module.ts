import { Module, forwardRef } from '@nestjs/common';
import { AuditService } from '../../core/audit.service.js';
import { PermissionGuard, RbacGuard, SESSION_AUTH_SERVICE, SessionAuthGuard } from '../../core/auth.guard.js';
import { PrismaService } from '../../core/http-kernel.js';
import { AuthModule } from '../auth/auth.module.js';
import { AuthService } from '../auth/auth.service.js';
import { ComplaintsModule } from '../complaints/complaints.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { ComplaintSurveysController, SurveysController } from './surveys.controller.js';
import { SurveysRepository } from './surveys.repository.js';
import { SurveysService } from './surveys.service.js';

@Module({
  imports: [AuthModule, forwardRef(() => ComplaintsModule), NotificationsModule],
  controllers: [SurveysController, ComplaintSurveysController],
  providers: [
    PrismaService,
    AuditService,
    SurveysRepository,
    SurveysService,
    {
      provide: SESSION_AUTH_SERVICE,
      inject: [AuthService],
      useFactory: (authService: AuthService) => authService,
    },
    SessionAuthGuard,
    PermissionGuard,
    RbacGuard,
  ],
  exports: [SurveysService],
})
export class SurveysModule {}

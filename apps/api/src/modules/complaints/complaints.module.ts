import { Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuditService } from '../../core/audit.service.js';
import { RbacGuard, SESSION_AUTH_SERVICE, SessionAuthGuard } from '../../core/auth.guard.js';
import { CsrfGuard } from '../../core/csrf.guard.js';
import { PrismaService } from '../../core/http-kernel.js';
import { AuthModule } from '../auth/auth.module.js';
import { AuthService } from '../auth/auth.service.js';
import { CasesModule } from '../cases/cases.module.js';
import { CasesService } from '../cases/cases.service.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { ComplaintsController } from './complaints.controller.js';
import { ComplaintFormOptionsService } from './complaint-form-options.service.js';
import { ComplaintsRepository } from './complaints.repository.js';
import { ComplaintsService } from './complaints.service.js';

@Module({
  imports: [AuthModule, NotificationsModule, CasesModule],
  controllers: [ComplaintsController],
  providers: [
    PrismaService,
    {
      provide: AuditService,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new AuditService(prisma),
    },
    {
      provide: ComplaintFormOptionsService,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new ComplaintFormOptionsService(prisma),
    },
    {
      provide: ComplaintsRepository,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new ComplaintsRepository(prisma),
    },
    {
      provide: ComplaintsService,
      inject: [ComplaintsRepository, AuditService, NotificationsService, CasesService],
      useFactory: (
        repository: ComplaintsRepository,
        audit: AuditService,
        notifications: NotificationsService,
        cases: CasesService,
      ) => new ComplaintsService(repository, audit, notifications, cases),
    },
    {
      provide: SESSION_AUTH_SERVICE,
      inject: [AuthService],
      useFactory: (authService: AuthService) => authService,
    },
    SessionAuthGuard,
    {
      provide: RbacGuard,
      inject: [Reflector, AuditService],
      useFactory: (reflector: Reflector, audit: AuditService) => new RbacGuard(reflector, audit),
    },
    CsrfGuard,
  ],
  exports: [ComplaintsService],
})
export class ComplaintsModule {}

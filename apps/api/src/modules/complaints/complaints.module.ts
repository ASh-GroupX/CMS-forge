import { Module, forwardRef } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuditService } from '../../core/audit.service.js';
import { DynamicPermissionGuard, PermissionGuard, RbacGuard, SESSION_AUTH_SERVICE, SessionAuthGuard } from '../../core/auth.guard.js';
import { CsrfGuard } from '../../core/csrf.guard.js';
import { PrismaService } from '../../core/http-kernel.js';
import { AuthModule } from '../auth/auth.module.js';
import { AuthService } from '../auth/auth.service.js';
import { CasesModule } from '../cases/cases.module.js';
import { CasesService } from '../cases/cases.service.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { SlaModule } from '../sla/sla.module.js';
import { SlaService } from '../sla/sla.service.js';
import { SurveysModule } from '../surveys/surveys.module.js';
import { SurveysService } from '../surveys/surveys.service.js';
import { ComplaintsController } from './complaints.controller.js';
import { ComplaintFormOptionsService } from './complaint-form-options.service.js';
import { ComplaintRelationsRepository } from './complaint-relations.repository.js';
import { ComplaintRelationsService } from './complaint-relations.service.js';
import { ComplaintsRepository } from './complaints.repository.js';
import { ComplaintsService } from './complaints.service.js';

@Module({
  imports: [AuthModule, NotificationsModule, CasesModule, SlaModule, forwardRef(() => SurveysModule)],
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
      provide: ComplaintRelationsRepository,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new ComplaintRelationsRepository(prisma),
    },
    {
      provide: ComplaintRelationsService,
      inject: [ComplaintRelationsRepository, AuditService],
      useFactory: (repository: ComplaintRelationsRepository, audit: AuditService) => new ComplaintRelationsService(repository, audit),
    },
    {
      provide: ComplaintsService,
      inject: [ComplaintsRepository, AuditService, NotificationsService, CasesService, SlaService, SurveysService],
      useFactory: (
        repository: ComplaintsRepository,
        audit: AuditService,
        notifications: NotificationsService,
        cases: CasesService,
        sla: SlaService,
        surveys: SurveysService,
      ) => new ComplaintsService(repository, audit, notifications, cases, sla, surveys),
    },
    {
      provide: SESSION_AUTH_SERVICE,
      inject: [AuthService],
      useFactory: (authService: AuthService) => authService,
    },
    SessionAuthGuard,
    PermissionGuard,
    DynamicPermissionGuard,
    {
      provide: RbacGuard,
      inject: [Reflector, AuditService],
      useFactory: (reflector: Reflector, audit: AuditService) => new RbacGuard(reflector, audit),
    },
    CsrfGuard,
  ],
  exports: [ComplaintsService, ComplaintFormOptionsService],
})
export class ComplaintsModule {}

import { Module } from '@nestjs/common';
import { AuditService } from '../../core/audit.service.js';
import { PermissionGuard, RbacGuard, SESSION_AUTH_SERVICE, SessionAuthGuard } from '../../core/auth.guard.js';
import { PrismaService } from '../../core/http-kernel.js';
import { AuthModule } from '../auth/auth.module.js';
import { AuthService } from '../auth/auth.service.js';
import { ComplaintsModule } from '../complaints/complaints.module.js';
import { SlaModule } from '../sla/sla.module.js';
import { SurveysModule } from '../surveys/surveys.module.js';
import { ReportsController } from './reports.controller.js';
import { ReportsRepository } from './reports.repository.js';
import { ReportsService } from './reports.service.js';

import { ReportsComplaintsRepository } from './reports.complaints.repository.js';
import { ReportsTicketsRepository } from './reports.tickets.repository.js';
import { ReportsDepartmentsRepository } from './reports.departments.repository.js';
import { ReportsAnalyticsService } from './reports.analytics.service.js';

@Module({
  imports: [AuthModule, ComplaintsModule, SlaModule, SurveysModule],
  controllers: [ReportsController],
  providers: [
    PrismaService,
    AuditService,
    ReportsRepository,
    ReportsComplaintsRepository,
    ReportsTicketsRepository,
    ReportsDepartmentsRepository,
    ReportsAnalyticsService,
    ReportsService,
    { provide: SESSION_AUTH_SERVICE, inject: [AuthService], useFactory: (authService: AuthService) => authService },
    SessionAuthGuard,
    RbacGuard,
    PermissionGuard,
  ],
  exports: [ReportsService, ReportsAnalyticsService],
})
export class ReportsModule {}

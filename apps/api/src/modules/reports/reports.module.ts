import { Module } from '@nestjs/common';
import { AuditService } from '../../core/audit.service.js';
import { RbacGuard, SESSION_AUTH_SERVICE, SessionAuthGuard } from '../../core/auth.guard.js';
import { PrismaService } from '../../core/http-kernel.js';
import { AuthModule } from '../auth/auth.module.js';
import { AuthService } from '../auth/auth.service.js';
import { ComplaintsModule } from '../complaints/complaints.module.js';
import { SlaModule } from '../sla/sla.module.js';
import { SurveysModule } from '../surveys/surveys.module.js';
import { ReportsController } from './reports.controller.js';
import { ReportsRepository } from './reports.repository.js';
import { ReportsService } from './reports.service.js';

@Module({
  imports: [AuthModule, ComplaintsModule, SlaModule, SurveysModule],
  controllers: [ReportsController],
  providers: [
    PrismaService,
    AuditService,
    ReportsRepository,
    ReportsService,
    { provide: SESSION_AUTH_SERVICE, inject: [AuthService], useFactory: (authService: AuthService) => authService },
    SessionAuthGuard,
    RbacGuard,
  ],
  exports: [ReportsService],
})
export class ReportsModule {}

import 'reflect-metadata';
import { Controller, Get, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  AppExceptionFilter,
  correlationMiddleware,
} from './core/http-kernel.js';
import { AdminModule } from './modules/admin/admin.module.js';
import { AuditModule } from './modules/audit/audit.module.js';
import { AttachmentsModule } from './modules/attachments/attachments.module.js';
import { AssignmentsModule } from './modules/assignments/assignments.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { BoardStagesModule } from './modules/board-stages/board-stages.module.js';
import { BranchesModule } from './modules/branches/branches.module.js';
import { DepartmentsModule } from './modules/departments/departments.module.js';
import { CasesModule } from './modules/cases/cases.module.js';
import { DealsModule } from './modules/deals/deals.module.js';
import { CommunicationGroupsModule } from './modules/communication-groups/communication-groups.module.js';
import { IntegrationsModule } from './modules/integrations/integrations.module.js';
import { PortalModule } from './modules/portal/portal.module.js';
import { ReportsModule } from './modules/reports/reports.module.js';
import { SurveysModule } from './modules/surveys/surveys.module.js';
import { TasksModule } from './modules/tasks/tasks.module.js';
import { SearchModule } from './modules/search/search.module.js';
import { CustomersModule } from './modules/customers/customers.module.js';
import { InternalTicketsModule } from './modules/internal-tickets/internal-tickets.module.js';
import { ComplaintsModule } from './modules/complaints/complaints.module.js';
import { ServiceBookingsModule } from './modules/service-bookings/service-bookings.module.js';

@Controller()
class HealthController {
  @Get()
  root(): Record<string, boolean | string> {
    return this.health();
  }

  @Get('health')
  health(): Record<string, boolean | string> {
    return {
      status: 'ok',
      service: 'api',
      databaseConfigured: Boolean(process.env.DATABASE_URL),
      redisConfigured: Boolean(process.env.REDIS_URL),
    };
  }
}

@Module({
  imports: [
    AuthModule,
    AdminModule,
    AuditModule,
    AssignmentsModule,
    BoardStagesModule,
    BranchesModule,
    DepartmentsModule,
    CasesModule,
    PortalModule,
    AttachmentsModule,
    IntegrationsModule,
    ReportsModule,
    SurveysModule,
    TasksModule,
    DealsModule,
    CommunicationGroupsModule,
    SearchModule,
    CustomersModule,
    InternalTicketsModule,
    ComplaintsModule,
    ServiceBookingsModule,
  ],
  controllers: [HealthController],
})
class AppModule {}

import { json, urlencoded } from 'express';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));
  app.use(correlationMiddleware);
  app.useGlobalFilters(new AppExceptionFilter());
  
  app.enableCors({
    origin: ['http://localhost:3001', process.env.FRONTEND_URL].filter(Boolean) as string[],
    credentials: true,
  });

  await app.listen(Number(process.env.PORT ?? 3000));
}

void bootstrap();

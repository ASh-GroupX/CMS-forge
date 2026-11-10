import { Module } from '@nestjs/common';
import { AuditService } from '../../core/audit.service.js';
import { PrismaService } from '../../core/http-kernel.js';
import { CustomersModule } from '../customers/customers.module.js';
import { ComplaintsModule } from '../complaints/complaints.module.js';
import { TasksModule } from '../tasks/tasks.module.js';
import { ServiceBookingsModule } from '../service-bookings/service-bookings.module.js';
import { IntegrationsModule } from '../integrations/integrations.module.js';
import { InternalTicketsModule } from '../internal-tickets/internal-tickets.module.js';
import { ExternalDataController } from './external-data.controller.js';
import { ExternalDataService } from './external-data.service.js';

@Module({
  imports: [IntegrationsModule, CustomersModule, ComplaintsModule, TasksModule, ServiceBookingsModule, InternalTicketsModule],
  controllers: [ExternalDataController],
  providers: [PrismaService, AuditService, ExternalDataService],
  exports: [ExternalDataService],
})
export class ExternalDataModule {}

import { Module } from '@nestjs/common';
import { PrismaService } from '../../core/http-kernel.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { SlaController } from './sla.controller.js';
import { SlaRepository } from './sla.repository.js';
import { SlaService } from './sla.service.js';

@Module({
  imports: [NotificationsModule],
  controllers: [SlaController],
  providers: [PrismaService, SlaRepository, SlaService],
  exports: [SlaService],
})
export class SlaModule {}

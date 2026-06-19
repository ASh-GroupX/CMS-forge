import { Module } from '@nestjs/common';
import { PrismaService } from '../../core/http-kernel.js';
import { NotificationsController } from './notifications.controller.js';
import { NotificationsRepository } from './notifications.repository.js';
import { NotificationsService } from './notifications.service.js';

@Module({
  controllers: [NotificationsController],
  providers: [PrismaService, NotificationsRepository, NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}

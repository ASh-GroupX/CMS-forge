import { Module } from '@nestjs/common';
import { AuditService } from '../../core/audit.service.js';
import { PrismaService } from '../../core/http-kernel.js';
import { ComplaintsController } from './complaints.controller.js';
import { ComplaintsRepository } from './complaints.repository.js';
import { ComplaintsService } from './complaints.service.js';

@Module({
  controllers: [ComplaintsController],
  providers: [PrismaService, AuditService, ComplaintsRepository, ComplaintsService],
  exports: [ComplaintsService],
})
export class ComplaintsModule {}

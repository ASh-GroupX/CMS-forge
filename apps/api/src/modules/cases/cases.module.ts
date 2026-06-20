import { Module } from '@nestjs/common';
import { AuditService } from '../../core/audit.service.js';
import { PrismaService } from '../../core/http-kernel.js';
import { CasesController } from './cases.controller.js';
import { CasesRepository } from './cases.repository.js';
import { CasesService } from './cases.service.js';

@Module({
  controllers: [CasesController],
  providers: [PrismaService, AuditService, CasesRepository, CasesService],
  exports: [CasesService],
})
export class CasesModule {}

import { Module } from '@nestjs/common';
import { AuditService } from '../../core/audit.service.js';
import { PrismaService } from '../../core/http-kernel.js';
import { BranchesController } from './branches.controller.js';
import { BranchesRepository } from './branches.repository.js';
import { BranchesService } from './branches.service.js';

@Module({
  controllers: [BranchesController],
  providers: [PrismaService, AuditService, BranchesRepository, BranchesService],
  exports: [BranchesService],
})
export class BranchesModule {}

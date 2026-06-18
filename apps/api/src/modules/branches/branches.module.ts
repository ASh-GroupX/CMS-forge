import { Module } from '@nestjs/common';
import { PrismaService } from '../../core/http-kernel.js';
import { BranchesController } from './branches.controller.js';
import { BranchesRepository } from './branches.repository.js';
import { BranchesService } from './branches.service.js';

@Module({
  controllers: [BranchesController],
  providers: [PrismaService, BranchesRepository, BranchesService],
  exports: [BranchesService],
})
export class BranchesModule {}

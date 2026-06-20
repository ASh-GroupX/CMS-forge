import { Module } from '@nestjs/common';
import { PrismaService } from '../../core/http-kernel.js';
import { CasesController } from './cases.controller.js';
import { CasesRepository } from './cases.repository.js';
import { CasesService } from './cases.service.js';

@Module({
  controllers: [CasesController],
  providers: [PrismaService, CasesRepository, CasesService],
  exports: [CasesService],
})
export class CasesModule {}

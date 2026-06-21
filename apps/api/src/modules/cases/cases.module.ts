import { Module } from '@nestjs/common';
import { AuditService } from '../../core/audit.service.js';
import { SESSION_AUTH_SERVICE, SessionAuthGuard } from '../../core/auth.guard.js';
import { PrismaService } from '../../core/http-kernel.js';
import { AuthModule } from '../auth/auth.module.js';
import { AuthService } from '../auth/auth.service.js';
import { CasesController } from './cases.controller.js';
import { CasesRepository } from './cases.repository.js';
import { CasesService } from './cases.service.js';

@Module({
  imports: [AuthModule],
  controllers: [CasesController],
  providers: [
    PrismaService,
    AuditService,
    {
      provide: CasesRepository,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new CasesRepository(prisma),
    },
    {
      provide: CasesService,
      inject: [CasesRepository, AuditService],
      useFactory: (repository: CasesRepository, audit: AuditService) => new CasesService(repository, audit),
    },
    {
      provide: SESSION_AUTH_SERVICE,
      inject: [AuthService],
      useFactory: (authService: AuthService) => authService,
    },
    SessionAuthGuard,
  ],
  exports: [CasesService],
})
export class CasesModule {}

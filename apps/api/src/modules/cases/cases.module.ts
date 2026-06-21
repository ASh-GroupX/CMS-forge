import { Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuditService } from '../../core/audit.service.js';
import { RbacGuard, SESSION_AUTH_SERVICE, SessionAuthGuard } from '../../core/auth.guard.js';
import { CsrfGuard } from '../../core/csrf.guard.js';
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
    {
      provide: AuditService,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new AuditService(prisma),
    },
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
    {
      provide: RbacGuard,
      inject: [Reflector, AuditService],
      useFactory: (reflector: Reflector, audit: AuditService) => new RbacGuard(reflector, audit),
    },
    CsrfGuard,
  ],
  exports: [CasesService],
})
export class CasesModule {}

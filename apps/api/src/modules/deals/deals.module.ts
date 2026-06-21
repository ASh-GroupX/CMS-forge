import { Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuditService } from '../../core/audit.service.js';
import { RbacGuard, SESSION_AUTH_SERVICE, SessionAuthGuard } from '../../core/auth.guard.js';
import { CsrfGuard } from '../../core/csrf.guard.js';
import { PrismaService } from '../../core/http-kernel.js';
import { AuthModule } from '../auth/auth.module.js';
import { AuthService } from '../auth/auth.service.js';
import { TasksModule } from '../tasks/tasks.module.js';
import { TasksService } from '../tasks/tasks.service.js';
import { DealsController } from './deals.controller.js';
import { DealsRepository } from './deals.repository.js';
import { DealsService } from './deals.service.js';

@Module({
  imports: [AuthModule, TasksModule],
  controllers: [DealsController],
  providers: [
    PrismaService,
    {
      provide: AuditService,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new AuditService(prisma),
    },
    {
      provide: DealsRepository,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new DealsRepository(prisma),
    },
    {
      provide: DealsService,
      inject: [DealsRepository, TasksService, AuditService],
      useFactory: (repository: DealsRepository, tasks: TasksService, audit: AuditService) => new DealsService(repository, tasks, audit),
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
  exports: [DealsService],
})
export class DealsModule {}

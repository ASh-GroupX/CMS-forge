import { Module } from '@nestjs/common';
import { AuditService } from '../../core/audit.service.js';
import { RbacGuard, SESSION_AUTH_SERVICE, SessionAuthGuard } from '../../core/auth.guard.js';
import { CsrfGuard } from '../../core/csrf.guard.js';
import { PrismaService } from '../../core/http-kernel.js';
import { AuthModule } from '../auth/auth.module.js';
import { AuthService } from '../auth/auth.service.js';
import { TasksController } from './tasks.controller.js';
import { TasksRepository } from './tasks.repository.js';
import { TasksService } from './tasks.service.js';

@Module({
  imports: [AuthModule],
  controllers: [TasksController],
  providers: [
    PrismaService,
    {
      provide: AuditService,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new AuditService(prisma),
    },
    TasksRepository,
    TasksService,
    {
      provide: SESSION_AUTH_SERVICE,
      inject: [AuthService],
      useFactory: (authService: AuthService) => authService,
    },
    SessionAuthGuard,
    RbacGuard,
    CsrfGuard,
  ],
  exports: [TasksService],
})
export class TasksModule {}

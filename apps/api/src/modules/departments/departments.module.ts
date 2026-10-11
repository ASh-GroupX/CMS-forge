import { Module } from '@nestjs/common';
import { AuditService } from '../../core/audit.service.js';
import { PermissionGuard, SESSION_AUTH_SERVICE, SessionAuthGuard } from '../../core/auth.guard.js';
import { CsrfGuard } from '../../core/csrf.guard.js';
import { PrismaService } from '../../core/http-kernel.js';
import { AuthModule } from '../auth/auth.module.js';
import { AuthService } from '../auth/auth.service.js';
import { DepartmentsController } from './departments.controller.js';
import { DepartmentsRepository } from './departments.repository.js';
import { DepartmentsService } from './departments.service.js';

@Module({
  imports: [AuthModule],
  controllers: [DepartmentsController],
  providers: [
    PrismaService,
    AuditService,
    DepartmentsRepository,
    DepartmentsService,
    {
      provide: SESSION_AUTH_SERVICE,
      inject: [AuthService],
      useFactory: (authService: AuthService) => authService,
    },
    SessionAuthGuard,
    PermissionGuard,
    CsrfGuard,
  ],
  exports: [DepartmentsService],
})
export class DepartmentsModule {}

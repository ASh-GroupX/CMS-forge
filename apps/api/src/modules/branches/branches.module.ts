import { Module } from '@nestjs/common';
import { AuditService } from '../../core/audit.service.js';
import { RbacGuard, SESSION_AUTH_SERVICE, SessionAuthGuard } from '../../core/auth.guard.js';
import { CsrfGuard } from '../../core/csrf.guard.js';
import { PrismaService } from '../../core/http-kernel.js';
import { AuthModule } from '../auth/auth.module.js';
import { AuthService } from '../auth/auth.service.js';
import { BranchesController } from './branches.controller.js';
import { BranchesRepository } from './branches.repository.js';
import { BranchesService } from './branches.service.js';

@Module({
  imports: [AuthModule],
  controllers: [BranchesController],
  providers: [
    PrismaService,
    AuditService,
    BranchesRepository,
    BranchesService,
    {
      provide: SESSION_AUTH_SERVICE,
      inject: [AuthService],
      useFactory: (authService: AuthService) => authService,
    },
    SessionAuthGuard,
    RbacGuard,
    CsrfGuard,
  ],
  exports: [BranchesService],
})
export class BranchesModule {}

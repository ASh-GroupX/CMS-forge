import { Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../core/http-kernel.js';
import { AuditService } from '../../core/audit.service.js';
import { RbacGuard, SessionAuthGuard, SESSION_AUTH_SERVICE } from '../../core/auth.guard.js';
import { CsrfGuard } from '../../core/csrf.guard.js';
import { AuthModule } from '../auth/auth.module.js';
import { AuthService } from '../auth/auth.service.js';
import { AdminModule } from '../admin/admin.module.js';
import { AdminUsersService } from '../admin/admin-users.service.js';
import { PortalIntakeController } from './portal-intake.controller.js';
import { PortalIntakeRepository } from './portal-intake.repository.js';
import { PortalIntakeService } from './portal-intake.service.js';

@Module({
  imports: [AuthModule, AdminModule],
  controllers: [PortalIntakeController],
  providers: [PrismaService, AuditService, SessionAuthGuard, CsrfGuard,
    { provide: SESSION_AUTH_SERVICE, inject: [AuthService], useFactory: (auth: AuthService) => auth },
    { provide: RbacGuard, inject: [Reflector, AuditService], useFactory: (reflector: Reflector, audit: AuditService) => new RbacGuard(reflector, audit) },
    { provide: PortalIntakeRepository, inject: [PrismaService], useFactory: (prisma: PrismaService) => new PortalIntakeRepository(prisma) },
    { provide: PortalIntakeService, inject: [PortalIntakeRepository, AdminUsersService, AuditService], useFactory: (repository: PortalIntakeRepository, admin: AdminUsersService, audit: AuditService) => new PortalIntakeService(repository, admin, audit) },
  ],
  exports: [PortalIntakeService],
})
export class PortalIntakeModule {}

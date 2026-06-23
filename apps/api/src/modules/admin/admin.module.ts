import { Module } from '@nestjs/common';
import { AuditService } from '../../core/audit.service.js';
import { RbacGuard, SESSION_AUTH_SERVICE, SessionAuthGuard } from '../../core/auth.guard.js';
import { CsrfGuard } from '../../core/csrf.guard.js';
import { PrismaService } from '../../core/http-kernel.js';
import { AuthModule } from '../auth/auth.module.js';
import { AuthService } from '../auth/auth.service.js';
import { AdminCategoriesController } from './admin-categories.controller.js';
import { AdminCategoriesRepository } from './admin-categories.repository.js';
import { AdminCategoriesService } from './admin-categories.service.js';
import { AdminUsersController, StaffLookupController } from './admin-users.controller.js';
import { AdminUsersRepository } from './admin-users.repository.js';
import { AdminUsersService } from './admin-users.service.js';
import { AdminRolesController } from './admin-roles.controller.js';
import { AdminRolesRepository } from './admin-roles.repository.js';
import { AdminRolesService } from './admin-roles.service.js';

@Module({
  imports: [AuthModule],
  controllers: [AdminUsersController, StaffLookupController, AdminCategoriesController, AdminRolesController],
  providers: [
    PrismaService,
    { provide: AuditService, inject: [PrismaService], useFactory: (prisma: PrismaService) => new AuditService(prisma) },
    {
      provide: SESSION_AUTH_SERVICE,
      inject: [AuthService],
      useFactory: (authService: AuthService) => authService,
    },
    SessionAuthGuard,
    RbacGuard,
    CsrfGuard,
    AdminCategoriesRepository,
    AdminCategoriesService,
    AdminUsersRepository,
    AdminUsersService,
    AdminRolesRepository,
    AdminRolesService,
  ],
  exports: [AdminUsersService, AdminCategoriesService, AdminRolesService],
})
export class AdminModule {}

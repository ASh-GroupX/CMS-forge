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
import { PortalFormService } from './portal-form.service.js';
import { ServiceBookingsModule } from '../service-bookings/service-bookings.module.js';
import { ServiceBookingsService } from '../service-bookings/service-bookings.service.js';

@Module({
  imports: [AuthModule, AdminModule, ServiceBookingsModule],
  controllers: [PortalIntakeController],
  providers: [PrismaService, AuditService, SessionAuthGuard, CsrfGuard,
    { provide: SESSION_AUTH_SERVICE, inject: [AuthService], useFactory: (auth: AuthService) => auth },
    { provide: RbacGuard, inject: [Reflector, AuditService], useFactory: (reflector: Reflector, audit: AuditService) => new RbacGuard(reflector, audit) },
    { provide: PortalIntakeRepository, inject: [PrismaService], useFactory: (prisma: PrismaService) => new PortalIntakeRepository(prisma) },
    { provide: PortalFormService, inject: [PortalIntakeRepository, AuditService, ServiceBookingsService], useFactory: (repository: PortalIntakeRepository, audit: AuditService, booking: ServiceBookingsService) => new PortalFormService(repository, audit, booking) },
    { provide: PortalIntakeService, inject: [PortalIntakeRepository, AdminUsersService, AuditService, PortalFormService], useFactory: (repository: PortalIntakeRepository, admin: AdminUsersService, audit: AuditService, forms: PortalFormService) => new PortalIntakeService(repository, admin, audit, forms) },
  ],
  exports: [PortalIntakeService],
})
export class PortalIntakeModule {}

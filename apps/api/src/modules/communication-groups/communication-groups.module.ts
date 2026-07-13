import { Module } from '@nestjs/common';
import { AuditService } from '../../core/audit.service.js';
import { PermissionGuard, SESSION_AUTH_SERVICE, SessionAuthGuard } from '../../core/auth.guard.js';
import { CsrfGuard } from '../../core/csrf.guard.js';
import { PrismaService } from '../../core/http-kernel.js';
import { AuthModule } from '../auth/auth.module.js';
import { AuthService } from '../auth/auth.service.js';
import { CommunicationGroupsController } from './communication-groups.controller.js';
import { CommunicationGroupsRepository } from './communication-groups.repository.js';
import { CommunicationGroupsService } from './communication-groups.service.js';

@Module({
  imports: [AuthModule],
  controllers: [CommunicationGroupsController],
  providers: [
    PrismaService,
    { provide: AuditService, inject: [PrismaService], useFactory: (prisma: PrismaService) => new AuditService(prisma) },
    { provide: SESSION_AUTH_SERVICE, inject: [AuthService], useFactory: (auth: AuthService) => auth },
    SessionAuthGuard,
    PermissionGuard,
    CsrfGuard,
    CommunicationGroupsRepository,
    CommunicationGroupsService,
  ],
  exports: [CommunicationGroupsService],
})
export class CommunicationGroupsModule {}

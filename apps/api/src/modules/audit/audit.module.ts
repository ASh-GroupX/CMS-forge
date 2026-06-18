import { Module } from '@nestjs/common';
import { AuditService } from '../../core/audit.service.js';
import { RbacGuard, SESSION_AUTH_SERVICE, SessionAuthGuard } from '../../core/auth.guard.js';
import { PrismaService } from '../../core/http-kernel.js';
import { AuthModule } from '../auth/auth.module.js';
import { AuthService } from '../auth/auth.service.js';
import { AuditController } from './audit.controller.js';
import { AuditRepository } from './audit.repository.js';
import { AuditSearchService } from './audit.service.js';

@Module({
  imports: [AuthModule],
  controllers: [AuditController],
  providers: [
    PrismaService,
    {
      provide: AuditService,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new AuditService(prisma),
    },
    {
      provide: AuditRepository,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new AuditRepository(prisma),
    },
    {
      provide: AuditSearchService,
      inject: [AuditRepository],
      useFactory: (repository: AuditRepository) => new AuditSearchService(repository),
    },
    {
      provide: SESSION_AUTH_SERVICE,
      inject: [AuthService],
      useFactory: (authService: AuthService) => authService,
    },
    SessionAuthGuard,
    RbacGuard,
  ],
})
export class AuditModule {}

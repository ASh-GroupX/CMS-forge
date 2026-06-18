import { Module } from '@nestjs/common';
import { AuditService } from '../../core/audit.service.js';
import { RbacGuard, SESSION_AUTH_SERVICE, SessionAuthGuard } from '../../core/auth.guard.js';
import { PrismaService } from '../../core/http-kernel.js';
import { AuthController } from './auth.controller.js';
import { AuthRepository } from './auth.repository.js';
import { AuthService } from './auth.service.js';

@Module({
  controllers: [AuthController],
  providers: [
    PrismaService,
    {
      provide: AuditService,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new AuditService(prisma),
    },
    {
      provide: AuthRepository,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new AuthRepository(prisma),
    },
    {
      provide: AuthService,
      inject: [AuthRepository, AuditService],
      useFactory: (repository: AuthRepository, audit: AuditService) => new AuthService(repository, audit),
    },
    { provide: SESSION_AUTH_SERVICE, useExisting: AuthService },
    SessionAuthGuard,
    RbacGuard,
  ],
  exports: [AuthService],
})
export class AuthModule {}

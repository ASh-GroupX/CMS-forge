import { Module } from '@nestjs/common';
import { PermissionGuard, SESSION_AUTH_SERVICE, SessionAuthGuard } from '../../core/auth.guard.js';
import { PrismaService } from '../../core/http-kernel.js';
import { AuditService } from '../../core/audit.service.js';
import { AuthModule } from '../auth/auth.module.js';
import { AuthService } from '../auth/auth.service.js';
import { CustomersController } from './customers.controller.js';
import { CustomersRepository } from './customers.repository.js';
import { CustomersService } from './customers.service.js';

@Module({
  imports: [AuthModule],
  controllers: [CustomersController],
  providers: [
    PrismaService,
    AuditService,
    CustomersRepository,
    CustomersService,
    {
      provide: SESSION_AUTH_SERVICE,
      inject: [AuthService],
      useFactory: (authService: AuthService) => authService,
    },
    SessionAuthGuard,
    PermissionGuard,
  ],
  exports: [CustomersService],
})
export class CustomersModule {}

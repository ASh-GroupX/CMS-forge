import { Module } from '@nestjs/common';
import { InternalTicketsController } from './internal-tickets.controller.js';
import { InternalTicketsRepository } from './internal-tickets.repository.js';
import { InternalTicketsService } from './internal-tickets.service.js';
import { PrismaService } from '../../core/http-kernel.js';
import { AuthModule } from '../auth/auth.module.js';
import { AttachmentsModule } from '../attachments/attachments.module.js';
import { AuthService } from '../auth/auth.service.js';
import { SESSION_AUTH_SERVICE, SessionAuthGuard } from '../../core/auth.guard.js';

@Module({
  imports: [AuthModule, AttachmentsModule],
  controllers: [InternalTicketsController],
  providers: [
    InternalTicketsRepository, 
    InternalTicketsService, 
    PrismaService,
    {
      provide: SESSION_AUTH_SERVICE,
      inject: [AuthService],
      useFactory: (authService: AuthService) => authService,
    },
    SessionAuthGuard,
  ],
  exports: [InternalTicketsService],
})
export class InternalTicketsModule {}

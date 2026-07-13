import { Module } from '@nestjs/common';
import { AuditService } from '../../core/audit.service.js';
import { PermissionGuard, SESSION_AUTH_SERVICE, SessionAuthGuard } from '../../core/auth.guard.js';
import { PrismaService } from '../../core/http-kernel.js';
import { AuthModule } from '../auth/auth.module.js';
import { AuthService } from '../auth/auth.service.js';
import { SearchController } from './search.controller.js';
import { SearchRepository } from './search.repository.js';
import { SearchService } from './search.service.js';

@Module({
  imports: [AuthModule],
  controllers: [SearchController],
  providers: [
    PrismaService,
    AuditService,
    { provide: SESSION_AUTH_SERVICE, inject: [AuthService], useFactory: (auth: AuthService) => auth },
    SessionAuthGuard,
    PermissionGuard,
    SearchRepository,
    SearchService,
  ],
  exports: [SearchService],
})
export class SearchModule {}

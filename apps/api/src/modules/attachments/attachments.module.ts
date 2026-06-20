import { Module } from '@nestjs/common';
import { AuditService } from '../../core/audit.service.js';
import { RbacGuard, SESSION_AUTH_SERVICE, SessionAuthGuard } from '../../core/auth.guard.js';
import { CsrfGuard } from '../../core/csrf.guard.js';
import { PrismaService } from '../../core/http-kernel.js';
import { AuthModule } from '../auth/auth.module.js';
import { AuthService } from '../auth/auth.service.js';
import { ComplaintsModule } from '../complaints/complaints.module.js';
import { PortalModule } from '../portal/portal.module.js';
import { ATTACHMENT_STORAGE, attachmentStorageFromEnv } from './attachment-storage.port.js';
import { AttachmentsController, PortalAttachmentsController } from './attachments.controller.js';
import { AttachmentsRepository } from './attachments.repository.js';
import { AttachmentsService } from './attachments.service.js';

@Module({
  imports: [AuthModule, ComplaintsModule, PortalModule],
  controllers: [AttachmentsController, PortalAttachmentsController],
  providers: [
    PrismaService,
    AuditService,
    AttachmentsRepository,
    AttachmentsService,
    { provide: ATTACHMENT_STORAGE, useFactory: () => attachmentStorageFromEnv() },
    {
      provide: SESSION_AUTH_SERVICE,
      inject: [AuthService],
      useFactory: (authService: AuthService) => authService,
    },
    SessionAuthGuard,
    RbacGuard,
    CsrfGuard,
  ],
  exports: [AttachmentsService],
})
export class AttachmentsModule {}

import { Module } from '@nestjs/common';
import { AuditService } from '../../core/audit.service.js';
import { PermissionGuard, SESSION_AUTH_SERVICE, SessionAuthGuard } from '../../core/auth.guard.js';
import { PrismaService } from '../../core/http-kernel.js';
import { AuthModule } from '../auth/auth.module.js';
import { AuthService } from '../auth/auth.service.js';
import { DMS_PROVIDER, InMemoryDmsProvider } from './dms-provider.port.js';
import { emailProviderFromEnv } from './email-provider.factory.js';
import { EMAIL_PROVIDER } from './email-provider.port.js';
import { IntegrationsController } from './integrations.controller.js';
import { IntegrationsRepository } from './integrations.repository.js';
import { IntegrationsService } from './integrations.service.js';
import { InMemorySmsProvider, SMS_PROVIDER } from './sms-provider.port.js';
import { InMemoryWhatsAppProvider, WHATSAPP_PROVIDER } from './whatsapp-provider.port.js';

@Module({
  imports: [AuthModule],
  controllers: [IntegrationsController],
  providers: [
    PrismaService,
    AuditService,
    IntegrationsRepository,
    IntegrationsService,
    {
      provide: SESSION_AUTH_SERVICE,
      inject: [AuthService],
      useFactory: (authService: AuthService) => authService,
    },
    SessionAuthGuard,
    PermissionGuard,
    { provide: EMAIL_PROVIDER, useFactory: () => emailProviderFromEnv() },
    { provide: SMS_PROVIDER, useClass: InMemorySmsProvider },
    { provide: WHATSAPP_PROVIDER, useClass: InMemoryWhatsAppProvider },
    { provide: DMS_PROVIDER, useClass: InMemoryDmsProvider },
  ],
  exports: [IntegrationsService],
})
export class IntegrationsModule {}

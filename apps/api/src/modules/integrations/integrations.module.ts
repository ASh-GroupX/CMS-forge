import { Module } from '@nestjs/common';
import { emailProviderFromEnv } from './email-provider.factory.js';
import { EMAIL_PROVIDER } from './email-provider.port.js';
import { IntegrationsController } from './integrations.controller.js';
import { IntegrationsRepository } from './integrations.repository.js';
import { IntegrationsService } from './integrations.service.js';
import { InMemorySmsProvider, SMS_PROVIDER } from './sms-provider.port.js';
import { InMemoryWhatsAppProvider, WHATSAPP_PROVIDER } from './whatsapp-provider.port.js';

@Module({
  controllers: [IntegrationsController],
  providers: [
    IntegrationsRepository,
    IntegrationsService,
    { provide: EMAIL_PROVIDER, useFactory: () => emailProviderFromEnv() },
    { provide: SMS_PROVIDER, useClass: InMemorySmsProvider },
    { provide: WHATSAPP_PROVIDER, useClass: InMemoryWhatsAppProvider },
  ],
  exports: [IntegrationsService],
})
export class IntegrationsModule {}

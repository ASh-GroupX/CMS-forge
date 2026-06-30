import { Inject, Injectable, Optional } from '@nestjs/common';
import {
  DMS_PROVIDER,
  InMemoryDmsProvider,
  normalizeDmsLookupResult,
  validateDmsLookupQuery,
} from './dms-provider.port.js';
import type { DmsLookupQuery, DmsLookupResult, DmsProviderPort } from './dms-provider.port.js';
import { EMAIL_PROVIDER, validateEmailMessage } from './email-provider.port.js';
import type { EmailMessageInput, EmailProviderPort, EmailSendResult } from './email-provider.port.js';
import { IntegrationsRepository } from './integrations.repository.js';
import { SMS_PROVIDER, validateSmsMessage } from './sms-provider.port.js';
import type { SmsMessageInput, SmsProviderPort, SmsSendResult } from './sms-provider.port.js';
import { validateWhatsAppMessage, WHATSAPP_PROVIDER } from './whatsapp-provider.port.js';
import type { WhatsAppMessageInput, WhatsAppProviderPort, WhatsAppSendResult } from './whatsapp-provider.port.js';

@Injectable()
export class IntegrationsService {
  constructor(
    private readonly integrationsRepository: IntegrationsRepository,
    @Inject(EMAIL_PROVIDER) private readonly emailProvider: EmailProviderPort,
    @Inject(SMS_PROVIDER) private readonly smsProvider: SmsProviderPort,
    @Inject(WHATSAPP_PROVIDER) private readonly whatsAppProvider: WhatsAppProviderPort,
    @Optional()
    @Inject(DMS_PROVIDER)
    private readonly dmsProvider: DmsProviderPort = new InMemoryDmsProvider(),
  ) {}

  async sendEmail(input: EmailMessageInput): Promise<EmailSendResult> {
    const message = validateEmailMessage(input);
    return this.emailProvider.send(message);
  }

  async sendSms(input: SmsMessageInput): Promise<SmsSendResult> {
    const message = validateSmsMessage(input);
    return this.smsProvider.send(message);
  }

  async sendWhatsApp(input: WhatsAppMessageInput): Promise<WhatsAppSendResult> {
    const message = validateWhatsAppMessage(input);
    return this.whatsAppProvider.send(message);
  }

  async lookupDmsCustomerVehicle(input: DmsLookupQuery): Promise<DmsLookupResult> {
    const query = validateDmsLookupQuery(input);
    const startedAt = Date.now();

    try {
      const response = await this.dmsProvider.lookupCustomerVehicle(query);
      return normalizeDmsLookupResult(response, query, Date.now() - startedAt);
    } catch {
      return normalizeDmsLookupResult({ status: 'PROVIDER_DOWN' }, query, Date.now() - startedAt);
    }
  }
}

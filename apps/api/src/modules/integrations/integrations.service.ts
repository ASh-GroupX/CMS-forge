import { Inject, Injectable } from '@nestjs/common';
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
  ) {}

  async sendEmail(input: EmailMessageInput): Promise<EmailSendResult> {
    return this.emailProvider.send(validateEmailMessage(input));
  }

  async sendSms(input: SmsMessageInput): Promise<SmsSendResult> {
    return this.smsProvider.send(validateSmsMessage(input));
  }

  async sendWhatsApp(input: WhatsAppMessageInput): Promise<WhatsAppSendResult> {
    return this.whatsAppProvider.send(validateWhatsAppMessage(input));
  }
}

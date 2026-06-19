import type { NotificationTemplateRecord } from '../notifications.repository.js';

export type NotificationTemplateResponseDto = {
  id: string;
  code: string;
  channel: string;
  locale: string;
  subject: string | null;
  body: string;
  version: number;
  versionNote: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export function notificationTemplateDto(template: NotificationTemplateRecord): NotificationTemplateResponseDto {
  return {
    id: template.id,
    code: template.code,
    channel: template.channel,
    locale: template.locale,
    subject: template.subject,
    body: template.body,
    version: template.version,
    versionNote: template.versionNote,
    isActive: template.isActive,
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString(),
  };
}

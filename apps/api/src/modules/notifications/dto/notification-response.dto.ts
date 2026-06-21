import type { NotificationRecord, NotificationTemplateRecord } from '../notifications.repository.js';

export type NotificationResponseDto = {
  id: string;
  status: string;
  templateCode: string;
  locale: string;
  payload: unknown;
  queuedAt: string;
};

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

export function notificationDto(notification: NotificationRecord): NotificationResponseDto {
  return {
    id: notification.id,
    status: notification.status,
    templateCode: notification.templateCode,
    locale: notification.locale,
    payload: notification.payload,
    queuedAt: notification.queuedAt.toISOString(),
  };
}

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

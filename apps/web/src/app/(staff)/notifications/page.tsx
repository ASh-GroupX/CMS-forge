import React from 'react';
import { NotificationCenter, type NotificationPreviewState } from '../../../components/notification-center';
import { resolveLocale } from '../../../i18n/staff-shell';
import { getStaffNotifications } from '../../../lib/staff-notifications-api';

type SearchParams = { locale?: string | string[]; notification?: string | string[] };

export default async function NotificationsPage({
  cookieHeader,
  fetchImpl,
  searchParams,
}: {
  cookieHeader?: string;
  fetchImpl?: typeof fetch;
  searchParams?: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const items = await getStaffNotifications({
    ...(cookieHeader !== undefined ? { cookieHeader } : {}),
    ...(fetchImpl !== undefined ? { fetchImpl } : {}),
  });
  return (
    <NotificationCenter items={items ?? undefined} locale={resolveLocale(readParam(params?.locale))} state={resolveState(readParam(params?.notification))} />
  );
}

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function resolveState(value: string | undefined): NotificationPreviewState | undefined {
  return value === 'loading' || value === 'empty' || value === 'error' || value === 'success' || value === 'validation' || value === 'conflict'
    ? value
    : undefined;
}

import React from 'react';
import { NotificationCenter, type NotificationFixtureState } from '../../../components/notification-center';
import { resolveLocale } from '../../../i18n/staff-shell';
import { getStaffNotifications } from '../../../lib/staff-notifications-api';
import { markAllNotificationsReadAction, markNotificationReadAction } from './actions';

type SearchParams = { locale?: string | string[]; notification?: string | string[]; view?: string | string[] };

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
  const view = notificationView(readParam(params?.view));
  const items = await getStaffNotifications({
    ...(cookieHeader !== undefined ? { cookieHeader } : {}),
    ...(fetchImpl !== undefined ? { fetchImpl } : {}),
    ...(view === 'all' ? {} : { view }),
  });
  return <NotificationCenter items={items} locale={resolveLocale(readParam(params?.locale))} markAllReadAction={markAllNotificationsReadAction} markReadAction={markNotificationReadAction} state={resolveState(readParam(params?.notification))} view={view} />;
}

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function notificationView(value: string | undefined): 'all' | 'unread' | 'mentions' { return value === 'unread' || value === 'mentions' ? value : 'all'; }

function resolveState(value: string | undefined): NotificationFixtureState | undefined {
  return value === 'loading' || value === 'empty' || value === 'error' || value === 'success' || value === 'validation' || value === 'conflict'
    ? value
    : undefined;
}

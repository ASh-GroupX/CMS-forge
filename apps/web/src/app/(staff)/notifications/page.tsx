import React from 'react';
import { NotificationCenter, type NotificationPreviewState } from '../../../components/notification-center';
import { resolveLocale } from '../../../i18n/staff-shell';

type SearchParams = { locale?: string | string[]; notification?: string | string[] };

export default async function NotificationsPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const params = await searchParams;
  return (
    <NotificationCenter locale={resolveLocale(readParam(params?.locale))} state={resolveState(readParam(params?.notification))} />
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

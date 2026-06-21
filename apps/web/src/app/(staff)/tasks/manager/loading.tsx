import { headers } from 'next/headers';
import React from 'react';
import { resolveLocale } from '../../../../i18n/staff-shell';
import { ManagerControlRoomLoading } from './page';

export default async function Loading() {
  const requestHeaders = await headers();
  const locale = resolveLocale(requestHeaders.get('x-cms-locale') ?? undefined);
  return <ManagerControlRoomLoading locale={locale} />;
}

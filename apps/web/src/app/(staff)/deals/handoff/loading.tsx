import { headers } from 'next/headers';
import React from 'react';
import { resolveLocale } from '../../../../i18n/staff-shell';
import { DealHandoffLoading } from './page';

export default async function Loading() {
  const requestHeaders = await headers();
  const locale = resolveLocale(requestHeaders.get('x-cms-locale') ?? undefined);
  return <DealHandoffLoading locale={locale} />;
}

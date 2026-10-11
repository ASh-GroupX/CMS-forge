import React from 'react';
import { headers } from 'next/headers';
import { resolveLocale } from '../../../i18n/staff-shell';
import { CommunicationInbox } from '../../../components/communication-inbox';

export default async function CommunicationPage() {
  const requestHeaders = await headers();
  const locale = resolveLocale(requestHeaders.get('x-cms-locale') ?? undefined);
  
  return (
    <div className="flex h-full w-full overflow-hidden bg-surface-sunken" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <CommunicationInbox locale={locale} />
    </div>
  );
}

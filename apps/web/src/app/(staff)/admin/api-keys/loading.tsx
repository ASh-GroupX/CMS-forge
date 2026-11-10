import React from 'react';
import { headers } from 'next/headers';
import { Card, CardContent, CardHeader } from '../../../../components/ui/card';
import { Skeleton } from '../../../../components/ui/skeleton';
import { adminApiKeysText } from '../../../../i18n/staff-admin-api-keys';
import { resolveLocale } from '../../../../i18n/staff-shell';

export default async function ApiKeysLoading() {
  const locale = resolveLocale((await headers()).get('x-cms-locale') ?? undefined);
  return <section aria-busy="true" aria-label={adminApiKeysText[locale].loading} className="mx-auto max-w-5xl space-y-6" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
    <Skeleton className="h-8 w-64" />
    <Card className="border-line-subtle bg-surface"><CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
      <CardContent className="space-y-5"><Skeleton className="h-10 w-full" /><Skeleton className="h-24 w-full" /><Skeleton className="h-10 w-36" /></CardContent>
    </Card>
    <Card className="border-line-subtle bg-surface"><CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
      <CardContent><Skeleton className="h-20 w-full" /></CardContent></Card>
  </section>;
}

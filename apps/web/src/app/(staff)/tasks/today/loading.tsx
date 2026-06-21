import { headers } from 'next/headers';
import React from 'react';
import { EmployeeTodayLoading } from '../../../../components/employee-today';
import { resolveLocale } from '../../../../i18n/staff-shell';

export default async function Loading() {
  const requestHeaders = await headers();
  const locale = resolveLocale(requestHeaders.get('x-cms-locale') ?? undefined);
  return <EmployeeTodayLoading locale={locale} />;
}

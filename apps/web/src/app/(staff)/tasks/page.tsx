import React from 'react';
import { resolveLocale } from '../../../i18n/staff-shell';
import { myWorkText } from '../../../i18n/staff-my-work';
import { getEmployeeTodayTasksLoadResult } from '../../../lib/staff-tasks-api';
import { MyWorkDashboard } from '../../../components/tasks/my-work-dashboard';

import { headers } from 'next/headers';

type SearchParams = { locale?: string | string[] };

export default async function TasksPage({
  searchParams,
  cookieHeader: propCookieHeader,
  fetchImpl,
}: {
  searchParams?: Promise<SearchParams>;
  cookieHeader?: string;
  fetchImpl?: typeof fetch;
}) {
  const params = await searchParams;
  const locale = resolveLocale(readParam(params?.locale));
  const t = myWorkText[locale];

  let cookieHeader = propCookieHeader;
  if (!cookieHeader) {
    const requestHeaders = await headers();
    cookieHeader = requestHeaders.get('cookie') ?? '';
  }
  // API URL is resolved inside the fetch helpers; omit explicit apiUrl here.
  const requestOptions = {
    cookieHeader,
    ...(fetchImpl !== undefined ? { fetchImpl } : {}),
  };

  const result = await getEmployeeTodayTasksLoadResult(requestOptions);

  if (result.status !== 'ready') {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <p className="text-content-muted">
          {result.status === 'denied' ? t.states.denied : t.states.error}
        </p>
      </div>
    );
  }

  return (
    <>
      <header className="grid gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-content-strong">{t.title}</h1>
        <p className="text-sm text-content-muted">{t.subtitle}</p>
      </header>
      <MyWorkDashboard data={result.data} locale={locale} t={t} />
    </>
  );
}

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

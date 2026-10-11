import React from 'react';
import { resolveLocale } from '../../../../../../i18n/staff-shell';
import { getStaffQueueLoadResult } from '../../../../../../lib/staff-queue-api';
import { TeamQueueScreen } from '../../../../../../components/team-queue';
import { getStaffSessionPrincipal } from '../../../../../../lib/staff-session-api';

type SearchParams = { locale?: string | string[] };

export default async function TeamQueuePage({
  cookieHeader,
  fetchImpl,
  searchParams,
}: {
  cookieHeader?: string;
  fetchImpl?: typeof fetch;
  searchParams?: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const locale = resolveLocale(readParam(params?.locale));

  const requestOptions = {
    ...(cookieHeader !== undefined ? { cookieHeader } : {}),
    ...(fetchImpl !== undefined ? { fetchImpl } : {}),
  };

  const principal = await getStaffSessionPrincipal(requestOptions);
  
  // Fetch queue items scoped to UNASSIGNED for this department.
  // We assume the user has a primary department from their profile/roles.
  // For Phase 1 we pass ownerScope='UNASSIGNED' to the existing endpoint.
  const queueResult = await getStaffQueueLoadResult({
    ...requestOptions,
    query: { ownerScope: 'UNASSIGNED', pageSize: 100 }
  });

  const state = queueResult.status === 'ready' ? undefined : queueResult.status;
  const items = queueResult.status === 'ready' ? queueResult.data.rows : null;
  
  // We mock the department name for now since it requires more user context
  const departmentName = locale === 'ar' ? 'العناية بالعملاء' : 'Customer Care';

  return (
    <TeamQueueScreen
      departmentName={departmentName}
      items={items}
      locale={locale}
      {...(state ? { state } : {})}
    />
  );
}

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

import React from 'react';
import { TaskConversation } from '../../../../components/task-conversation';
import { resolveLocale } from '../../../../i18n/staff-shell';
import { taskConversationText } from '../../../../i18n/staff-task-conversation';
import { getStaffTaskComments, getStaffTaskDetail } from '../../../../lib/staff-task-detail-api';
import { getStaffSessionPrincipal } from '../../../../lib/staff-session-api';

type SearchParams = { locale?: string | string[] };

export default async function TaskDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<SearchParams>;
}) {
  const [{ id }, values] = await Promise.all([params, searchParams]);
  const locale = resolveLocale(Array.isArray(values?.locale) ? values?.locale[0] : values?.locale);
  const [task, comments, principal] = await Promise.all([
    getStaffTaskDetail({ taskId: id }),
    getStaffTaskComments({ taskId: id }),
    getStaffSessionPrincipal().catch(() => null),
  ]);
  if (!task) {
    return (
      <p className="rounded-md border border-line-subtle bg-surface-raised p-4 text-sm text-content-muted">
        {taskConversationText[locale].unavailable}
      </p>
    );
  }
  const isAdmin = principal?.roleCode === 'ADMIN' || Boolean(principal?.permissions?.includes('ADMIN_SYSTEM_CONFIG'));
  return <TaskConversation comments={comments ?? []} locale={locale} task={task} isAdmin={isAdmin} />;
}

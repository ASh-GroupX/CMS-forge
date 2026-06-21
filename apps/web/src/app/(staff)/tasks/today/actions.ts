'use server';

import { redirect } from 'next/navigation';
import { quickAddTask, updateTask, type StaffTaskStatus } from '../../../../lib/staff-tasks-api';

export async function quickAddTaskAction(formData: FormData): Promise<void> {
  const locale = safeLocale(formData.get('locale'));
  const link = linkFrom(formData);
  if (formData.get('isCustomerPromise') === 'on' && !isPromiseLink(link)) redirect(`/tasks/today?locale=${locale}&task=link-required`);
  const ok = await quickAddTask({
    title: text(formData, 'title'),
    what: text(formData, 'what'),
    whoId: text(formData, 'whoId'),
    when: text(formData, 'when'),
    isCustomerPromise: formData.get('isCustomerPromise') === 'on',
    ...(optionalText(formData, 'dueAt') ? { dueAt: text(formData, 'dueAt') } : {}),
    ...(link ? { links: [link] } : {}),
  });
  redirect(`/tasks/today?locale=${locale}&task=${ok ? 'success' : 'error'}`);
}

export async function updateTaskAction(formData: FormData): Promise<void> {
  const locale = safeLocale(formData.get('locale'));
  const taskId = text(formData, 'taskId');
  const status = optionalStatus(formData.get('status'));
  const nextActionWhat = optionalText(formData, 'nextActionWhat');
  const nextActionWhoId = optionalText(formData, 'nextActionWhoId');
  const nextActionWhen = optionalText(formData, 'nextActionWhen');
  const ok = await updateTask(taskId, {
    ...(status ? { status } : {}),
    ...(optionalText(formData, 'assigneeId') ? { assigneeId: text(formData, 'assigneeId') } : {}),
    ...(optionalText(formData, 'dueAt') ? { dueAt: text(formData, 'dueAt') } : {}),
    ...(nextActionWhat && nextActionWhoId && nextActionWhen
      ? { nextAction: { what: nextActionWhat, whoId: nextActionWhoId, when: nextActionWhen } }
      : {}),
  });
  redirect(`/tasks/today?locale=${locale}&task=${ok ? 'success' : 'error'}`);
}

function linkFrom(formData: FormData): { entityType: string; entityId: string } | null {
  const entityType = optionalText(formData, 'linkEntityType');
  const entityId = optionalText(formData, 'linkEntityId');
  return entityType && entityId ? { entityType, entityId } : null;
}

function isPromiseLink(link: { entityType: string; entityId: string } | null): boolean {
  return link !== null && ['CUSTOMER', 'COMPLAINT', 'CASE', 'DEAL'].includes(link.entityType);
}

function optionalStatus(value: FormDataEntryValue | null): StaffTaskStatus | null {
  return value === 'OPEN' || value === 'IN_PROGRESS' || value === 'WAITING' || value === 'DONE' ? value : null;
}

function safeLocale(value: FormDataEntryValue | null): 'ar' | 'en' {
  return value === 'ar' ? 'ar' : 'en';
}

function optionalText(formData: FormData, name: string): string | null {
  const value = text(formData, name);
  return value ? value : null;
}

function text(formData: FormData, name: string): string {
  return String(formData.get(name) ?? '').trim();
}

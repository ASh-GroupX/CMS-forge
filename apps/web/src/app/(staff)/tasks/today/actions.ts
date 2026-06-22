'use server';

import { redirect } from 'next/navigation';
import { getAssignableStaff } from '../../../../lib/staff-assignable-staff-api';
import { getQuickAddRelatedRecords, type RelatedRecordType, type StaffRelatedRecord } from '../../../../lib/staff-related-records-api';
import { quickAddTask, updateTask, type StaffTaskStatus } from '../../../../lib/staff-tasks-api';

export async function quickAddTaskAction(formData: FormData): Promise<void> {
  const locale = safeLocale(formData.get('locale'));
  const link = await linkFrom(formData);
  if (formData.get('isCustomerPromise') === 'on' && !isPromiseLink(link)) redirect(`/tasks/today?locale=${locale}&task=link-required`);
  const ok = await quickAddTask({
    title: text(formData, 'title'),
    what: text(formData, 'what'),
    whoId: await whoIdFrom(formData),
    when: text(formData, 'when'),
    isCustomerPromise: formData.get('isCustomerPromise') === 'on',
    ...(optionalText(formData, 'dueAt') ? { dueAt: text(formData, 'dueAt') } : {}),
    ...(link ? { links: [link] } : {}),
  });
  redirect(`/tasks/today?locale=${locale}&task=${ok ? 'success' : 'error'}`);
}

async function whoIdFrom(formData: FormData): Promise<string> {
  const id = text(formData, 'whoId');
  if (id) return id;
  const label = text(formData, 'assigneeLabel');
  if (!label) return '';
  const staff = await getAssignableStaff();
  return staff?.find((person) => [person.displayName, person.role, person.branchLabel].filter(Boolean).join(' - ') === label
    || [person.displayNameAr, person.roleAr, person.branchLabelAr].filter(Boolean).join(' - ') === label)?.userId ?? '';
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

async function linkFrom(formData: FormData): Promise<{ entityType: string; entityId: string } | null> {
  const entityType = optionalText(formData, 'linkEntityType');
  const entityId = optionalText(formData, 'linkEntityId');
  if (entityType && entityId) return { entityType, entityId };

  const type = relatedRecordType(formData.get('relatedRecordType'));
  const label = text(formData, 'relatedRecordLabel');
  if (!type || !label) return null;
  const records = await getQuickAddRelatedRecords();
  const record = records?.[type].find((item) => relatedRecordLabels(item).includes(label));
  return record ? { entityType: record.recordType, entityId: record.recordId } : null;
}

function isPromiseLink(link: { entityType: string; entityId: string } | null): boolean {
  return link !== null && ['CUSTOMER', 'COMPLAINT', 'CASE', 'DEAL'].includes(link.entityType);
}

function optionalStatus(value: FormDataEntryValue | null): StaffTaskStatus | null {
  return value === 'OPEN' || value === 'IN_PROGRESS' || value === 'WAITING' || value === 'DONE' ? value : null;
}

function relatedRecordType(value: FormDataEntryValue | null): RelatedRecordType | null {
  return value === 'CUSTOMER' || value === 'COMPLAINT' || value === 'CASE' || value === 'DEAL' ? value : null;
}

function relatedRecordLabels(record: StaffRelatedRecord): string[] {
  return [
    [record.label, record.context].filter(Boolean).join(' - '),
    [record.labelAr, record.contextAr].filter(Boolean).join(' - '),
  ];
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

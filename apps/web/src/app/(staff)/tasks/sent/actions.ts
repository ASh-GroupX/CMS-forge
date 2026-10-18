'use server';

import { redirect } from 'next/navigation';
import { commentOnTask, nudgeTask } from '../../../../lib/staff-sent-tasks-api';

export async function commentOnTaskAction(formData: FormData): Promise<void> {
  const locale = safeLocale(formData.get('locale'));
  const ok = await commentOnTask(text(formData, 'taskId'), text(formData, 'body'));
  redirect(`/tasks/sent?locale=${locale}&task=${ok ? 'success' : 'error'}`);
}

export async function nudgeTaskAction(formData: FormData): Promise<void> {
  const locale = safeLocale(formData.get('locale'));
  const message = text(formData, 'message');
  const ok = await nudgeTask(text(formData, 'taskId'), message || undefined);
  redirect(`/tasks/sent?locale=${locale}&task=${ok ? 'success' : 'error'}`);
}

function safeLocale(value: FormDataEntryValue | null): 'ar' | 'en' {
  return value === 'ar' ? 'ar' : 'en';
}

function text(formData: FormData, name: string): string {
  return String(formData.get(name) ?? '').trim();
}

'use server';

import { redirect } from 'next/navigation';
import { updateTask } from '../../../../lib/staff-tasks-api';

export async function updatePromiseAction(formData: FormData): Promise<void> {
  const locale = formData.get('locale') === 'ar' ? 'ar' : 'en';
  const taskId = String(formData.get('taskId') ?? '').trim();
  const ok = taskId ? await updateTask(taskId, { status: 'DONE' }) : false;
  redirect(`/tasks/promises?locale=${locale}&promise=${ok ? 'success' : 'error'}`);
}

'use server';

import { redirect } from 'next/navigation';
import { updateTask } from '../../../../lib/staff-tasks-api';

export async function updatePromiseAction(formData: FormData): Promise<void> {
  const locale = formData.get('locale') === 'ar' ? 'ar' : 'en';
  const taskId = String(formData.get('taskId') ?? '').trim();
  const statusNote = String(formData.get('statusNote') ?? '').trim();
  const result = taskId ? await updateTask(taskId, { status: 'DONE', statusNote }) : 'error';
  redirect(`/tasks/promises?locale=${locale}&promise=${result}`);
}

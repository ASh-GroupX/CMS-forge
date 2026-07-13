'use server';

import { redirect } from 'next/navigation';
import { markAllStaffNotificationsRead, markStaffNotificationRead } from '../../../lib/staff-notifications-api';

export async function markNotificationReadAction(formData: FormData): Promise<void> {
  const locale = formData.get('locale') === 'ar' ? 'ar' : 'en';
  const notificationId = String(formData.get('notificationId') ?? '').trim();
  const ok = notificationId ? await markStaffNotificationRead(notificationId) : false;
  redirect(`/notifications?locale=${locale}&notification=${ok ? 'success' : 'error'}`);
}

export async function markAllNotificationsReadAction(formData: FormData): Promise<void> {
  const locale = formData.get('locale') === 'ar' ? 'ar' : 'en';
  const ok = await markAllStaffNotificationsRead();
  redirect(`/notifications?locale=${locale}&notification=${ok ? 'success' : 'error'}`);
}

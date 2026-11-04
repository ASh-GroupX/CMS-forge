import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { NotificationIndicator } from '../../src/components/notification-center/notification-indicator';
import { NotificationCenter } from '../../src/components/notification-center';

export function NotificationFixture({ locale = 'en' }: { locale?: 'en' | 'ar' }) {
  return <main dir={locale === 'ar' ? 'rtl' : 'ltr'} className="space-y-6 p-6">
    <nav className="flex justify-end p-2"><NotificationIndicator locale={locale} href={`/notifications?locale=${locale}`} /></nav>
    <NotificationCenter locale={locale} items={[{ id: 'activity-1', status: 'SENT', readAt: null, templateCode: 'task.assigned', queuedAt: '2026-11-04T10:00:00Z',
      targetType: 'TASK', targetId: 'task-1', payload: { title: locale === 'ar' ? 'تم إسناد مهمة جديدة إليك' : 'A new task was assigned to you', message: locale === 'ar' ? 'يرجى مراجعة المهمة والتحديثات الأخيرة.' : 'Review the task and its latest updates.', taskId: 'task-1' } }]} />
  </main>;
}
if (typeof document !== 'undefined') hydrateRoot(document.getElementById('root')!, <NotificationFixture locale={document.documentElement.lang === 'ar' ? 'ar' : 'en'} />);

import type { Locale } from './staff-shell';

export const notificationCenterText: Record<Locale, typeof enNotificationCenterText> = {
  en: {
    title: 'Notifications',
    subtitle: 'In-app updates scoped by backend authorization.',
    sections: { unread: 'Unread', read: 'Read' },
    labels: { complaint: 'Complaint link', markRead: 'Mark read', open: 'Open scoped complaint', time: 'Time' },
    badges: { unread: 'Unread', read: 'Read', workflow: 'Workflow', sla: 'SLA' },
    states: {
      loading: 'Loading notifications.',
      empty: 'No notifications are available.',
      error: 'Notifications could not be loaded. Try again.',
      success: 'Notification marked as read.',
      validation: 'Notification action is not available.',
      conflict: 'Notification changed by someone else. Reload before retrying.',
    },
    safeNote: 'Complaint links stay scoped by the backend; this panel does not grant access.',
  },
  ar: {
    title: 'الإشعارات',
    subtitle: 'تحديثات داخل النظام ضمن صلاحيات الخادم.',
    sections: { unread: 'غير مقروء', read: 'مقروء' },
    labels: { complaint: 'رابط الشكوى', markRead: 'تحديد كمقروء', open: 'فتح الشكوى المصرح بها', time: 'الوقت' },
    badges: { unread: 'غير مقروء', read: 'مقروء', workflow: 'سير العمل', sla: 'اتفاقية الخدمة' },
    states: {
      loading: 'جار تحميل الإشعارات.',
      empty: 'لا توجد إشعارات.',
      error: 'تعذر تحميل الإشعارات. حاول مرة أخرى.',
      success: 'تم تحديد الإشعار كمقروء.',
      validation: 'إجراء الإشعار غير متاح.',
      conflict: 'تم تغيير الإشعار بواسطة مستخدم آخر. أعد التحميل قبل المحاولة.',
    },
    safeNote: 'تبقى روابط الشكاوى مقيدة من الخادم؛ هذه اللوحة لا تمنح صلاحية.',
  },
};

const enNotificationCenterText = {
  title: '',
  subtitle: '',
  sections: { unread: '', read: '' },
  labels: { complaint: '', markRead: '', open: '', time: '' },
  badges: { unread: '', read: '', workflow: '', sla: '' },
  states: { loading: '', empty: '', error: '', success: '', validation: '', conflict: '' },
  safeNote: '',
};

import type { Locale } from './staff-shell';

export const notificationCenterText: Record<Locale, typeof enNotificationCenterText> = {
  en: {
    title: 'Notifications',
    subtitle: 'Open the updates that need your attention. If a link is disabled, the app cannot safely open it.',
    sections: { unread: 'Unread', read: 'Read' },
    labels: { complaint: 'Complaint link', markAllRead: 'Mark all read', markRead: 'Mark read', open: 'Open', task: 'Task link', time: 'Time', all: 'All', unread: 'Unread', mentions: 'Mentions' },
    badges: { unread: 'Unread', read: 'Read', workflow: 'Workflow', sla: 'SLA', task: 'Task' },
    states: {
      loading: 'Loading notifications.',
      empty: 'No notifications right now. New task and case updates will appear here.',
      error: 'Notifications could not be loaded. Refresh the page or sign in again.',
      success: 'Notification marked as read.',
      validation: 'This notification cannot be opened safely.',
      conflict: 'Notification changed. Reload before retrying.',
    },
    safeNote: 'Opening a notification only works when your account is allowed to see the target.',
  },
  ar: {
    title: 'الإشعارات',
    subtitle: 'متابعة أحدث التنبيهات والإشارات والمهام التي تتطلب اهتمامك.',
    sections: { unread: 'غير مقروء', read: 'مقروء' },
    labels: { complaint: 'رابط الشكوى', markAllRead: 'تحديد الكل كمقروء', markRead: 'تحديد كمقروء', open: 'فتح التفاصيل', task: 'رابط المهمة', time: 'الوقت', all: 'الكل', unread: 'غير مقروء', mentions: 'الإشارات' },
    badges: { unread: 'غير مقروء', read: 'مقروء', workflow: 'سير العمل', sla: 'اتفاقية الخدمة', task: 'مهمة' },
    states: {
      loading: 'جارٍ تحميل الإشعارات...',
      empty: 'لا توجد إشعارات جديدة حالياً. ستظهر هنا كافة التحديثات والمهام المسندة إليك.',
      error: 'تعذر تحميل الإشعارات. يُرجى المحاولة مرة أخرى.',
      success: 'تم تحديد الإشعار كمقروء.',
      validation: 'تعذر فتح الرابط لعدم توفر الصلاحية الكافية.',
      conflict: 'تم تحديث حالة الإشعار. يُرجى إعادة تحميل الصفحة.',
    },
    safeNote: 'يخضع فتح تفاصيل الشكاوى والمهام لصلاحيات الحساب المعتمدة في النظام.',
  },
};

const enNotificationCenterText = {
  title: '',
  subtitle: '',
  sections: { unread: '', read: '' },
  labels: { complaint: '', markAllRead: '', markRead: '', open: '', task: '', time: '', all: '', unread: '', mentions: '' },
  badges: { unread: '', read: '', workflow: '', sla: '', task: '' },
  states: { loading: '', empty: '', error: '', success: '', validation: '', conflict: '' },
  safeNote: '',
};

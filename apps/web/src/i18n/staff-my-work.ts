import type { Locale } from './staff-shell';

export const myWorkText = {
  en: {
    title: 'My Work',
    subtitle: 'Everything you need to do, organized by urgency.',
    tabs: {
      dueToday: 'Due Today',
      overdue: 'Overdue',
      inProgress: 'In Progress',
      sent: 'Sent',
      promises: 'Promises',
      waiting: 'Waiting on Me',
    },
    counts: {
      dueToday: '{count} due today',
      overdue: '{count} overdue',
      inProgress: '{count} in progress',
      sent: '{count} sent',
      promises: '{count} promises',
      waiting: '{count} waiting',
    },
    empty: {
      dueToday: 'You have no work due today.',
      overdue: 'Great job! You have no overdue work.',
      inProgress: 'You have no work currently in progress.',
      sent: 'You have not sent any work to others.',
      promises: 'You have no active customer promises.',
      waiting: 'No one is waiting on you for any work.',
    },
    row: {
      complaint: 'Complaint',
      task: 'Task',
      dueIn: 'Due in {time}',
      overdue: 'Overdue by {time}',
      assignedTo: 'Assigned to {name}',
    },
    states: {
      loading: 'Loading your work...',
      error: 'Could not load your work. Refresh the page or sign in again.',
      denied: 'You do not have permission to view this work.',
    },
  },
  ar: {
    title: 'عملي',
    subtitle: 'كل ما تحتاج لإنجازه، مرتب حسب الأهمية.',
    tabs: {
      dueToday: 'مستحق اليوم',
      overdue: 'متأخر',
      inProgress: 'قيد التنفيذ',
      sent: 'المرسلة',
      promises: 'الوعود',
      waiting: 'في انتظاري',
    },
    counts: {
      dueToday: '{count} مستحق اليوم',
      overdue: '{count} متأخر',
      inProgress: '{count} قيد التنفيذ',
      sent: '{count} مرسلة',
      promises: '{count} وعود',
      waiting: '{count} في انتظاري',
    },
    empty: {
      dueToday: 'ليس لديك أعمال مستحقة اليوم.',
      overdue: 'عمل رائع! ليس لديك أي أعمال متأخرة.',
      inProgress: 'ليس لديك أعمال قيد التنفيذ حالياً.',
      sent: 'لم ترسل أي أعمال للآخرين.',
      promises: 'ليس لديك وعود نشطة للعملاء.',
      waiting: 'لا أحد ينتظر منك إنجاز أي عمل.',
    },
    row: {
      complaint: 'شكوى',
      task: 'مهمة',
      dueIn: 'مستحق خلال {time}',
      overdue: 'متأخر بمقدار {time}',
      assignedTo: 'مسندة إلى {name}',
    },
    states: {
      loading: 'جاري تحميل أعمالك...',
      error: 'تعذر تحميل أعمالك. حاول مرة أخرى.',
      denied: 'ليست لديك صلاحية لعرض هذه الأعمال.',
    },
  },
} as const;

export type MyWorkCopy = (typeof myWorkText)[Locale];

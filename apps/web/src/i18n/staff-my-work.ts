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
      completed: 'Completed',
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
      completed: 'You have no completed work.',
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
    title: 'مهامي وأعمالي',
    subtitle: 'جميع المهام والأعمال المطلوبة منك، مصنفة حسب الأولوية والاستحقاق.',
    tabs: {
      dueToday: 'مستحق اليوم',
      overdue: 'متأخر',
      inProgress: 'قيد التنفيذ',
      sent: 'المرسلة',
      completed: 'المكتملة',
      promises: 'التزامات العملاء',
      waiting: 'قيد انتظاري',
    },
    counts: {
      dueToday: '{count} مستحق اليوم',
      overdue: '{count} متأخر',
      inProgress: '{count} قيد التنفيذ',
      sent: '{count} مرسلة',
      promises: '{count} التزامات للعملاء',
      waiting: '{count} قيد انتظاري',
    },
    empty: {
      dueToday: 'ليس لديك أعمال مستحقة اليوم.',
      overdue: 'عمل رائع! ليس لديك أي أعمال متأخرة.',
      inProgress: 'ليس لديك أعمال قيد التنفيذ حالياً.',
      sent: 'لم ترسل أي أعمال للآخرين.',
      completed: 'ليس لديك أعمال مكتملة.',
      promises: 'ليس لديك التزامات نشطة تجاه العملاء.',
      waiting: 'لا توجد أعمال معلقة بانتظار ردك حالياً.',
    },
    row: {
      complaint: 'شكوى',
      task: 'مهمة',
      dueIn: 'مستحق خلال {time}',
      overdue: 'متأخر منذ {time}',
      assignedTo: 'مسندة إلى {name}',
    },
    states: {
      loading: 'جارٍ تحميل مهامك وأعمالك...',
      error: 'تعذر تحميل قائمة المهام. يُرجى إعادة المحاولة.',
      denied: 'ليست لديك صلاحية لعرض هذه الأعمال.',
    },
  },
} as const;

export type MyWorkCopy = (typeof myWorkText)[Locale];

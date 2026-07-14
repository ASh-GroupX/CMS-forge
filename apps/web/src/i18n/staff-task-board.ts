import type { Locale } from './staff-shell';

// Task board (Kanban) copy — docs/CMSS_REVAMP_PLAN.md A6. en + ar, RTL-ready.

export const taskBoardText = {
  en: {
    title: 'Task board',
    subtitle: 'Drag a card between columns to move the task forward.',
    view: { label: 'View', board: 'Board', list: 'List' },
    boardLabel: 'Task board columns',
    columnLabel: '{name} column, {count} cards',
    cardCount: { one: '1 card', other: '{count} cards' },
    states: {
      loading: 'Loading the task board.',
      empty: 'No tasks on the board yet. New tasks appear here as soon as they are assigned.',
      error: 'The task board could not be loaded. Refresh the page or sign in again.',
      denied: 'You do not have permission to view the task board.',
    },
    columnEmpty: 'Drop a card here',
    card: {
      daysActive: { one: '1 day active', other: '{count} days active' },
      comments: { one: '1 update', other: '{count} updates' },
      promise: 'Customer promise',
      dueStates: { OVERDUE: 'Overdue', DUE_TODAY: 'Due today', UPCOMING: 'Upcoming' },
      assigneeFallback: 'Unassigned',
      dragHandle: 'Drag task: {title}',
    },
    noteDialog: {
      title: 'Add a status note',
      help: 'Moving this task to {stage} needs a short note about the outcome.',
      noteLabel: 'Status note',
      notePlaceholder: 'What happened? e.g. Called the customer and confirmed the fix.',
      confirm: 'Move task',
      cancel: 'Cancel',
    },
    toasts: {
      moved: 'Task moved to {stage}.',
      moveFailed: 'The task could not be moved. Try again.',
      moveDenied: 'You do not have permission to move this task.',
      stageMissing: 'That column no longer exists. Refresh the board.',
      nextActionRequired: 'Reopening a finished task needs a next action. Open the task from Today to set it.',
    },
    a11y: {
      instructions: 'Press space or enter to pick up a card, use the arrow keys to move it, and press space or enter again to drop it. Press escape to cancel.',
      pickedUp: 'Picked up task {title}.',
      movedOver: 'Task {title} is over the {stage} column.',
      dropped: 'Task {title} dropped on the {stage} column.',
      canceled: 'Moving task {title} was canceled.',
    },
  },
  ar: {
    title: 'لوحة المهام',
    subtitle: 'اسحب البطاقة بين الأعمدة لنقل المهمة إلى المرحلة التالية.',
    view: { label: 'العرض', board: 'لوحة', list: 'قائمة' },
    boardLabel: 'أعمدة لوحة المهام',
    columnLabel: 'عمود {name}، {count} بطاقة',
    cardCount: { one: 'بطاقة واحدة', other: '{count} بطاقات' },
    states: {
      loading: 'جارٍ تحميل لوحة المهام.',
      empty: 'لا توجد مهام على اللوحة بعد. ستظهر المهام الجديدة هنا فور إسنادها.',
      error: 'تعذر تحميل لوحة المهام. حدّث الصفحة أو سجّل الدخول مرة أخرى.',
      denied: 'ليس لديك صلاحية لعرض لوحة المهام.',
    },
    columnEmpty: 'أفلت البطاقة هنا',
    card: {
      daysActive: { one: 'يوم واحد نشط', other: '{count} أيام نشطة' },
      comments: { one: 'تحديث واحد', other: '{count} تحديثات' },
      promise: 'وعد للعميل',
      dueStates: { OVERDUE: 'متأخرة', DUE_TODAY: 'تستحق اليوم', UPCOMING: 'قادمة' },
      assigneeFallback: 'غير مسندة',
      dragHandle: 'اسحب المهمة: {title}',
    },
    noteDialog: {
      title: 'أضف ملاحظة حالة',
      help: 'نقل هذه المهمة إلى {stage} يتطلب ملاحظة قصيرة عن النتيجة.',
      noteLabel: 'ملاحظة الحالة',
      notePlaceholder: 'ماذا حدث؟ مثال: اتصلت بالعميل وتأكدت من الحل.',
      confirm: 'انقل المهمة',
      cancel: 'إلغاء',
    },
    toasts: {
      moved: 'نُقلت المهمة إلى {stage}.',
      moveFailed: 'تعذر نقل المهمة. حاول مرة أخرى.',
      moveDenied: 'ليس لديك صلاحية لنقل هذه المهمة.',
      stageMissing: 'هذا العمود لم يعد موجوداً. حدّث اللوحة.',
      nextActionRequired: 'إعادة فتح مهمة منجزة تتطلب إجراءً تالياً. افتح المهمة من صفحة اليوم لتحديده.',
    },
    a11y: {
      instructions: 'اضغط مسافة أو إدخال لالتقاط البطاقة، واستخدم مفاتيح الأسهم لتحريكها، ثم اضغط مسافة أو إدخال مرة أخرى لإفلاتها. اضغط زر الهروب للإلغاء.',
      pickedUp: 'التُقطت المهمة {title}.',
      movedOver: 'المهمة {title} فوق عمود {stage}.',
      dropped: 'أُفلتت المهمة {title} في عمود {stage}.',
      canceled: 'أُلغي نقل المهمة {title}.',
    },
  },
} as const satisfies Record<Locale, unknown>;

export type TaskBoardText = (typeof taskBoardText)[Locale];

export function formatBoardText(template: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce((text, [key, value]) => text.replaceAll(`{${key}}`, String(value)), template);
}

export function formatBoardCount(count: number, copy: { one: string; other: string }): string {
  return count === 1 ? copy.one : formatBoardText(copy.other, { count });
}

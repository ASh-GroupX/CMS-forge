import type { Locale } from './staff-shell';

// Ticket board (Kanban) copy — docs/CMSS_REVAMP_PLAN.md B5. en + ar, RTL-ready.
// Dropping a card fires the existing complaint workflow; per-action field labels
// come from staff-complaint-detail's workflow copy (reused, never duplicated).

export const complaintBoardText = {
  en: {
    title: 'Ticket board',
    subtitle: 'Drag a ticket to a column to run that workflow step. Greyed columns are not allowed from the current status.',
    boardLabel: 'Ticket board columns',
    columnLabel: '{name} column, {count} tickets',
    ticketCount: { one: '1 ticket', other: '{count} tickets' },
    states: {
      loading: 'Loading the ticket board.',
      empty: 'No tickets on the board yet. Complaints appear here as they move through the workflow.',
      error: 'The ticket board could not be loaded. Refresh the page or sign in again.',
      denied: 'You do not have permission to view the ticket board.',
    },
    columnEmpty: 'No tickets in this column',
    card: {
      ownerFallback: 'Unassigned',
      owner: 'Owner: {name}',
      nextAction: 'Next: {action}',
      noAllowedTransitions: 'No actions available from your role',
      dragHandle: 'Drag ticket {reference}',
      severity: { CRITICAL: 'Critical', HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low' },
      sla: { ON_TRACK: 'On track', WARNING: 'SLA warning', BREACHED: 'SLA breached', CLOSED: 'Closed' },
    },
    dialog: {
      title: '{action}',
      help: 'Moving {reference} to {stage} runs this workflow step. Fill in what it needs, then confirm.',
      confirm: 'Confirm',
      cancel: 'Cancel',
      submitting: 'Applying…',
      validation: 'Fill in the required fields before confirming.',
      conflictTitle: 'The ticket changed',
      conflict: 'This ticket already moved on. The board was refreshed — review it and try again.',
      close: 'Close',
    },
    toasts: {
      transitioned: '{reference} moved to {stage}.',
      illegal: 'That column is not a valid next step for {reference}.',
      denied: 'You do not have permission to run that step.',
      notFound: 'That ticket no longer exists. Refresh the board.',
      failed: 'The ticket could not be moved. Try again.',
    },
    a11y: {
      instructions: 'Press space or enter to pick up a ticket, use the arrow keys to move it over a column, and press space or enter again to drop it. Press escape to cancel.',
      pickedUp: 'Picked up ticket {reference}.',
      movedOver: 'Ticket {reference} is over the {stage} column.',
      dropped: 'Ticket {reference} dropped on the {stage} column.',
      canceled: 'Moving ticket {reference} was canceled.',
    },
  },
  ar: {
    title: 'لوحة التذاكر',
    subtitle: 'اسحب التذكرة إلى عمود لتنفيذ خطوة سير العمل تلك. الأعمدة الرمادية غير مسموح بها من الحالة الحالية.',
    boardLabel: 'أعمدة لوحة التذاكر',
    columnLabel: 'عمود {name}، {count} تذكرة',
    ticketCount: { one: 'تذكرة واحدة', other: '{count} تذاكر' },
    states: {
      loading: 'جارٍ تحميل لوحة التذاكر.',
      empty: 'لا توجد تذاكر على اللوحة بعد. تظهر الشكاوى هنا أثناء تنقلها في سير العمل.',
      error: 'تعذر تحميل لوحة التذاكر. حدّث الصفحة أو سجّل الدخول مرة أخرى.',
      denied: 'ليس لديك صلاحية لعرض لوحة التذاكر.',
    },
    columnEmpty: 'لا توجد تذاكر في هذا العمود',
    card: {
      ownerFallback: 'غير مسندة',
      owner: 'المسؤول: {name}',
      nextAction: 'التالي: {action}',
      noAllowedTransitions: 'لا توجد إجراءات متاحة لدورك',
      dragHandle: 'اسحب التذكرة {reference}',
      severity: { CRITICAL: 'حرجة', HIGH: 'عالية', MEDIUM: 'متوسطة', LOW: 'منخفضة' },
      sla: { ON_TRACK: 'ضمن المهلة', WARNING: 'تحذير المهلة', BREACHED: 'تجاوز المهلة', CLOSED: 'مغلقة' },
    },
    dialog: {
      title: '{action}',
      help: 'نقل {reference} إلى {stage} ينفّذ خطوة سير العمل هذه. أكمل ما تتطلبه ثم أكّد.',
      confirm: 'تأكيد',
      cancel: 'إلغاء',
      submitting: 'جارٍ التطبيق…',
      validation: 'أكمل الحقول المطلوبة قبل التأكيد.',
      conflictTitle: 'تغيّرت التذكرة',
      conflict: 'انتقلت هذه التذكرة بالفعل. حُدِّثت اللوحة — راجعها وحاول مرة أخرى.',
      close: 'إغلاق',
    },
    toasts: {
      transitioned: 'نُقلت {reference} إلى {stage}.',
      illegal: 'هذا العمود ليس خطوة تالية صالحة للتذكرة {reference}.',
      denied: 'ليس لديك صلاحية لتنفيذ تلك الخطوة.',
      notFound: 'هذه التذكرة لم تعد موجودة. حدّث اللوحة.',
      failed: 'تعذر نقل التذكرة. حاول مرة أخرى.',
    },
    a11y: {
      instructions: 'اضغط مسافة أو إدخال لالتقاط التذكرة، واستخدم مفاتيح الأسهم لتحريكها فوق عمود، ثم اضغط مسافة أو إدخال مرة أخرى لإفلاتها. اضغط زر الهروب للإلغاء.',
      pickedUp: 'التُقطت التذكرة {reference}.',
      movedOver: 'التذكرة {reference} فوق عمود {stage}.',
      dropped: 'أُفلتت التذكرة {reference} في عمود {stage}.',
      canceled: 'أُلغي نقل التذكرة {reference}.',
    },
  },
} as const satisfies Record<Locale, unknown>;

export type ComplaintBoardText = (typeof complaintBoardText)[Locale];

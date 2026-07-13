import type { Locale } from './staff-shell';

export const modernUiText: Record<Locale, typeof en> = {
  en: {
    search: { label: 'Search', placeholder: 'Search complaints, tasks, cases, deals, or customers', hint: 'Enter at least 2 characters', loading: 'Searching…', empty: 'No authorized records found', error: 'Search is unavailable. Try again.', types: { COMPLAINT: 'Complaint', TASK: 'Task', CASE: 'Case', DEAL: 'Deal', CUSTOMER: 'Customer' } },
    dashboard: { greeting: 'Welcome, {name}', scope: 'Your authorized work scope and the items that need attention now.', attention: 'Needs your attention', dueToday: 'Due today', overdue: 'Overdue', openMyWork: 'Open my work', createComplaint: 'Create complaint', recentUpdates: 'Recent updates', viewAll: 'View all', noAttention: 'Nothing urgent is waiting right now.', noUpdates: 'No recent updates in your scope.', recordUpdate: 'Record update', teamWorkload: 'Team workload exceptions', assignedItems: 'assigned items' },
    queue: { title: 'Quick filters', mine: 'My complaints', unassigned: 'Unassigned', overdue: 'Overdue', clear: 'Clear all', active: 'Active filters', results: 'results on this page' },
  },
  ar: {
    search: { label: 'بحث', placeholder: 'ابحث في الشكاوى والمهام والحالات والصفقات والعملاء', hint: 'أدخل حرفين على الأقل', loading: 'جاري البحث…', empty: 'لم يتم العثور على سجلات مصرح بها', error: 'البحث غير متاح. حاول مرة أخرى.', types: { COMPLAINT: 'شكوى', TASK: 'مهمة', CASE: 'حالة', DEAL: 'صفقة', CUSTOMER: 'عميل' } },
    dashboard: { greeting: 'مرحباً، {name}', scope: 'نطاق عملك المصرح والعناصر التي تحتاج إلى انتباهك الآن.', attention: 'يحتاج إلى انتباهك', dueToday: 'يستحق اليوم', overdue: 'متأخر', openMyWork: 'فتح مهامي', createComplaint: 'إنشاء شكوى', recentUpdates: 'آخر التحديثات', viewAll: 'عرض الكل', noAttention: 'لا يوجد عمل عاجل ينتظر الآن.', noUpdates: 'لا توجد تحديثات حديثة ضمن نطاقك.', recordUpdate: 'تحديث سجل', teamWorkload: 'استثناءات عبء الفريق', assignedItems: 'عناصر مسندة' },
    queue: { title: 'مرشحات سريعة', mine: 'شكاواي', unassigned: 'غير مسندة', overdue: 'متأخرة', clear: 'مسح الكل', active: 'المرشحات النشطة', results: 'نتائج في هذه الصفحة' },
  },
};

const en = {
  search: { label: '', placeholder: '', hint: '', loading: '', empty: '', error: '', types: { COMPLAINT: '', TASK: '', CASE: '', DEAL: '', CUSTOMER: '' } },
  dashboard: { greeting: '', scope: '', attention: '', dueToday: '', overdue: '', openMyWork: '', createComplaint: '', recentUpdates: '', viewAll: '', noAttention: '', noUpdates: '', recordUpdate: '', teamWorkload: '', assignedItems: '' },
  queue: { title: '', mine: '', unassigned: '', overdue: '', clear: '', active: '', results: '' },
};

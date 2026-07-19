import type { Locale } from './staff-shell';

const en = {
  search: { label: 'Search', placeholder: 'Search updates, tasks, or complaints…', hint: 'Enter at least 2 characters', loading: 'Searching…', empty: 'No authorized records found', error: 'Search is unavailable. Try again.', types: { COMPLAINT: 'Complaint', TASK: 'Task', CASE: 'Case', DEAL: 'Deal', CUSTOMER: 'Customer' } },
  dashboard: { greetings: { morning: 'Good morning, {name}', afternoon: 'Good afternoon, {name}', evening: 'Good evening, {name}', hello: 'Hello, {name}' }, attention: 'Needs your attention', mainIndicators: 'Key performance indicators', recentUpdates: 'Updates and messages', teamWorkload: 'Team', viewAll: 'View all', tasks: 'tasks', complaints: 'complaints', promises: 'customer promises', waitingOnMe: 'waiting on you', overdueDetail: 'Past the expected completion time', dueTodayDetail: 'Due today', dueSoonDetail: 'Approaching the SLA target', waitingDetail: 'Your response is required', updatesShown: 'Recent updates shown', openTasks: 'open', unread: 'Unread', openMyWork: 'Open my work', createComplaint: 'Create complaint', noUpdates: 'No recent updates in your scope.', noTeamData: 'Team workload is not available for your role.', recordUpdate: 'Record update' },
  queue: { title: 'Quick filters', mine: 'My complaints', unassigned: 'Unassigned', overdue: 'Overdue', clear: 'Clear all', active: 'Active filters', results: 'results on this page' },
};

export const modernUiText: Record<Locale, typeof en> = {
  en,
  ar: {
    search: { label: 'بحث', placeholder: 'ابحث في التحديثات، المهام، أو الشكاوى…', hint: 'أدخل حرفين على الأقل', loading: 'جاري البحث…', empty: 'لم يتم العثور على سجلات مصرح بها', error: 'البحث غير متاح. حاول مرة أخرى.', types: { COMPLAINT: 'شكوى', TASK: 'مهمة', CASE: 'حالة', DEAL: 'صفقة', CUSTOMER: 'عميل' } },
    dashboard: { greetings: { morning: 'صباح الخير، {name}', afternoon: 'مساء الخير، {name}', evening: 'مساء الخير، {name}', hello: 'مرحباً، {name}' }, attention: 'ما يحتاج انتباهك', mainIndicators: 'مؤشرات الأداء الرئيسية', recentUpdates: 'التحديثات والرسائل', teamWorkload: 'الفريق', viewAll: 'عرض الكل', tasks: 'مهام', complaints: 'شكاوى', promises: 'وعود للعملاء', waitingOnMe: 'بانتظارك', overdueDetail: 'تجاوز موعد الإنجاز المتوقع', dueTodayDetail: 'موعد الاستحقاق اليوم', dueSoonDetail: 'تقترب من هدف الخدمة', waitingDetail: 'تحتاج إلى ردك', updatesShown: 'التحديثات المعروضة', openTasks: 'مفتوحة', unread: 'غير مقروء', openMyWork: 'فتح مهامي', createComplaint: 'إنشاء شكوى', noUpdates: 'لا توجد تحديثات حديثة ضمن نطاقك.', noTeamData: 'عبء الفريق غير متاح لدورك.', recordUpdate: 'تحديث على سجل' },
    queue: { title: 'مرشحات سريعة', mine: 'شكاوي', unassigned: 'غير مسندة', overdue: 'متأخرة', clear: 'مسح الكل', active: 'المرشحات النشطة', results: 'نتائج في هذه الصفحة' },
  },
};

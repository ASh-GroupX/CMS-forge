import React from 'react';
import { DashboardSummary as GoldenDashboard, DashboardSummaryLoading } from '../components/dashboard-summary';
import type { Locale } from '../i18n/staff-shell';
import type { StaffDashboardSummary } from '../lib/staff-dashboard-api';
import type { StaffNotification } from '../lib/staff-notifications-api';
import type { StaffSessionPrincipal } from '../lib/staff-session-api';
import type { EmployeeTodayTasks, ManagerControlRoomTasks, StaffTask } from '../lib/staff-tasks-api';

type RolePreview = 'staff' | 'admin' | 'management';
export type DashboardFixtureState = 'loading' | 'empty' | 'error';

export function DashboardSummary({ locale, role, state, summary }: { locale: Locale; role: RolePreview; state?: DashboardFixtureState | undefined; summary?: StaffDashboardSummary | undefined }) {
  if (state === 'loading') return <DashboardSummaryLoading locale={locale} />;
  const empty = state === 'empty';
  return <GoldenDashboard
    data={state === 'error' ? null : summary ?? (empty ? zeroSummary : fixtureSummary)}
    locale={locale}
    manager={role === 'staff' ? null : empty ? emptyManager : fixtureManager(locale)}
    notifications={empty ? [] : fixtureNotifications(locale)}
    principal={fixturePrincipal(locale, role)}
    tasks={state === 'error' ? null : empty ? emptyTasks : fixtureTasks}
  />;
}

const zeroSummary: StaffDashboardSummary = { openComplaints: 0, overdueComplaints: 0, slaWarningComplaints: 0, closedComplaints: 0, averageTatHours: 0 };
const fixtureSummary: StaffDashboardSummary = { openComplaints: 56, overdueComplaints: 3, slaWarningComplaints: 2, closedComplaints: 128, averageTatHours: 57.6 };
const emptyTasks: EmployeeTodayTasks = { completed: [], dueToday: [], overdue: [], overduePromises: [], assignedToMe: [], waitingOnMe: [] };
const emptyManager: ManagerControlRoomTasks = { dueToday: [], overduePromises: [], escalated: [], overdueByEmployee: [], stuck: [], workloadByAssignee: [], promiseKpi: { openPromiseCount: 0, overduePromiseCount: 0 } };
const fixtureTasks: EmployeeTodayTasks = { completed: tasks(8), dueToday: tasks(4), overdue: tasks(5), overduePromises: tasks(2), assignedToMe: tasks(5), waitingOnMe: tasks(3) };

function fixturePrincipal(locale: Locale, role: RolePreview): StaffSessionPrincipal {
  return { sessionId: 'visual-session', userId: 'visual-user', email: 'visual@example.invalid', nameEn: 'Ahmed Al-Masri', nameAr: 'أحمد المصري', roleCode: role === 'admin' ? 'ADMIN' : role === 'management' ? 'CR_MANAGER' : 'STAFF', permissions: ['COMPLAINT_CREATE', 'REPORT_VIEW'], branchId: 'visual-branch', branchName: 'Cairo Branch', branchNameAr: 'فرع القاهرة', branchTimezone: 'Africa/Cairo' };
}

function fixtureNotifications(locale: Locale): StaffNotification[] {
  const ar = locale === 'ar';
  return [
    note('1', ar ? 'سارة خالد' : 'Sara Khaled', ar ? 'تم التواصل مع العميل وتحديد موعد الحل' : 'Customer contacted and resolution date confirmed', false),
    note('2', ar ? 'محمد ياسر' : 'Mohamed Yasser', ar ? 'تمت إضافة ملاحظة داخلية على الشكوى' : 'Added an internal complaint note', false),
    note('3', ar ? 'نورهان علي' : 'Norhan Ali', ar ? 'تم إغلاق الشكوى وإرسال استبيان رضا العميل' : 'Complaint closed and survey sent', true),
    note('4', ar ? 'نظام التنبيهات' : 'Alert system', ar ? 'تم تعيين وعد جديد للعميل' : 'New customer promise assigned', true),
    note('5', ar ? 'عميل سعيد' : 'Happy customer', ar ? 'شكراً لكم على سرعة الاستجابة' : 'Thank you for the quick response', true),
  ];
}

function note(id: string, title: string, message: string, read: boolean): StaffNotification { return { id, status: 'SENT', readAt: read ? '2026-06-20T09:00:00.000Z' : null, targetHref: '/notifications', templateCode: 'visual.update', queuedAt: `2026-06-20T0${id}:00:00.000Z`, payload: { title, message } }; }
function fixtureManager(locale: Locale): ManagerControlRoomTasks { const names = locale === 'ar' ? ['سارة خالد', 'محمد ياسر', 'نورهان علي', 'أحمد رضا'] : ['Sara Khaled', 'Mohamed Yasser', 'Norhan Ali', 'Ahmed Reda']; return { ...emptyManager, workloadByAssignee: names.map((name, index) => ({ assigneeId: `user-${index}`, assigneeName: name, count: [18, 12, 9, 5][index]! })) }; }
function tasks(count: number): StaffTask[] { return Array.from({ length: count }, (_, index) => ({ id: `visual-task-${count}-${index}`, title: 'Visual task', ownerId: 'visual-owner', ownerName: null, assigneeId: 'visual-user', assigneeName: null, branchId: 'visual-branch', branchName: null, displayTimeZone: 'Africa/Cairo', dueAt: '2026-06-20T09:00:00.000Z', status: 'OPEN', nextAction: null, isCustomerPromise: false, visibility: 'INTERNAL', confidentialityLevel: 'NORMAL', links: [], participantUserIds: [], createdAt: '2026-06-20T09:00:00.000Z', updatedAt: '2026-06-20T09:00:00.000Z' })); }

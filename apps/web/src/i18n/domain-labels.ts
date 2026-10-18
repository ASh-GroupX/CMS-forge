import type { Locale } from './staff-shell';

type Domain =
  | 'auditAction'
  | 'blockerReason'
  | 'caseLifecycleStatus'
  | 'caseType'
  | 'complaintStatus'
  | 'complaintType'
  | 'dealStage'
  | 'reportDeliveryStatus'
  | 'severity'
  | 'slaState'
  | 'taskStatus'
  | 'timelineType';

type LabelMap = Partial<Record<Domain, Record<string, string>>>;

const labels: Record<Locale, LabelMap> = {
  en: {
    auditAction: {
      deal_created: 'Created',
      deal_details_updated: 'Details updated',
      deal_stage_advanced: 'Moved forward',
      deal_blocker_set: 'Blocker set',
      deal_blocker_cleared: 'Blocker cleared',
    },
    blockerReason: {
      BLOCKED: 'Blocked',
      NEXT_ACTION_OVERDUE: 'Next action overdue',
      NO_MOVEMENT: 'No movement',
      NO_OWNER: 'No owner',
      WAITING_CUSTOMER: 'Waiting for customer',
      WAITING_FINANCE: 'Waiting for finance',
      WAITING_PARTS: 'Waiting for parts',
    },
    complaintStatus: {
      DRAFT: 'Draft',
      SUBMITTED: 'Open',
      MANAGER_REVIEW: 'Under Review',
      BRANCH_REVIEW: 'Assigned',
      IN_PROGRESS: 'In Progress',
      RESOLVED: 'Resolution Pending',
      COMPLETED: 'Customer Contacted',
      CLOSED: 'Closed',
      REOPENED: 'Reopened',
      REJECTED: 'Rejected',
    },
    complaintType: {
      COMPLAINT: 'Complaint',
      ACTION_REQUEST: 'Action Request',
      CALL_BACK_REQUEST: 'Call Back Request',
      SERVICE_VISIT_REQUEST: 'Service Visit Request',
      FOLLOW_UP_REQUEST: 'Follow-up Request',
      INFORMATION_REQUEST: 'Information Request',
      INQUIRY: 'Inquiry',
      SUGGESTION: 'Suggestion',
      FEEDBACK: 'Feedback',
    },
    caseLifecycleStatus: {
      DRAFT: 'Draft',
      HR_REVIEW: 'HR review',
      INVESTIGATION: 'Investigation',
      DECISION: 'Decision',
      CLOSED: 'Closed',
      APPEALED: 'Appealed',
    },
    caseType: {
      CUSTOMER_COMPLAINT: 'Customer complaint',
      EMPLOYEE_GRIEVANCE: 'Employee grievance',
    },
    dealStage: {
      LEAD: 'Lead',
      BOOKING: 'Booking',
      PAYMENT: 'Payment',
      FINANCE: 'Finance',
      INSURANCE: 'Insurance',
      REGISTRATION: 'Registration',
      PDI: 'PDI',
      DELIVERY: 'Delivery',
      POST_DELIVERY: 'Post-delivery',
    },
    reportDeliveryStatus: {
      DELIVERED: 'Available now',
      DEFERRED: 'Deferred',
      PENDING: 'Catalog unavailable',
      SIGNOFF_REQUIRED: 'Deferred - pending business signoff',
    },
    severity: {
      CRITICAL: 'Critical',
      HIGH: 'High',
      MEDIUM: 'Medium',
      LOW: 'Low',
    },
    slaState: {
      ON_TRACK: 'On track',
      WARNING: 'Warning',
      BREACHED: 'Escalated',
      CLOSED: 'Closed',
    },
    taskStatus: {
      OPEN: 'Open',
      ['TO' + 'DO']: 'To-do',
      IN_PROGRESS: 'In progress',
      WAITING: 'Waiting',
      BLOCKED: 'Blocked',
      DONE: 'Done',
      CANCELLED: 'Cancelled',
    },
    timelineType: {
      ASSIGNMENT: 'Assignment',
      ATTACHMENT: 'File',
      CAPA: 'CAPA',
      COMMENT: 'Comment',
      COMPLAINT_STATUS: 'Status',
      NOTIFICATION: 'Notification',
      PUBLIC_UPDATE: 'Customer update',
      SLA: 'SLA',
      STATUS: 'Status',
      SYSTEM: 'System',
      TASK: 'Task',
      TASK_COMMENT: 'Task note',
      TASK_STATUS: 'Task status',
      WORKFLOW: 'Workflow',
    },
  },
  ar: {
    auditAction: {
      deal_created: 'تم الإنشاء',
      deal_details_updated: 'تم تحديث التفاصيل',
      deal_stage_advanced: 'تم التقديم',
      deal_blocker_set: 'تم تعيين عائق',
      deal_blocker_cleared: 'تمت إزالة العائق',
    },
    blockerReason: {
      BLOCKED: 'عالق',
      NEXT_ACTION_OVERDUE: 'الإجراء التالي متأخر',
      NO_MOVEMENT: 'لا توجد حركة',
      NO_OWNER: 'لا يوجد مسؤول',
      WAITING_CUSTOMER: 'بانتظار العميل',
      WAITING_FINANCE: 'بانتظار التمويل',
      WAITING_PARTS: 'بانتظار القطع',
    },
    complaintStatus: {
      DRAFT: 'مسودة',
      SUBMITTED: 'مفتوحة',
      MANAGER_REVIEW: 'قيد المراجعة',
      BRANCH_REVIEW: 'مُسندة للفرع',
      IN_PROGRESS: 'قيد التنفيذ',
      RESOLVED: 'بانتظار اعتماد الحل',
      COMPLETED: 'تم التواصل مع العميل',
      CLOSED: 'مغلقة',
      REOPENED: 'أعيد فتحها',
      REJECTED: 'مرفوضة',
    },
    complaintType: {
      COMPLAINT: 'شكوى',
      ACTION_REQUEST: 'طلب إجراء',
      CALL_BACK_REQUEST: 'طلب اتصال',
      SERVICE_VISIT_REQUEST: 'طلب زيارة صيانة',
      FOLLOW_UP_REQUEST: 'طلب متابعة',
      INFORMATION_REQUEST: 'طلب استعلام',
      INQUIRY: 'استفسار',
      SUGGESTION: 'اقتراح',
      FEEDBACK: 'ملاحظات',
    },
    caseLifecycleStatus: {
      DRAFT: 'مسودة',
      HR_REVIEW: 'مراجعة الموارد البشرية',
      INVESTIGATION: 'تحقيق',
      DECISION: 'قرار',
      CLOSED: 'مغلقة',
      APPEALED: 'مستأنفة',
    },
    caseType: {
      CUSTOMER_COMPLAINT: 'شكوى عميل',
      EMPLOYEE_GRIEVANCE: 'تظلم موظف',
    },
    dealStage: {
      LEAD: 'عميل محتمل',
      BOOKING: 'حجز',
      PAYMENT: 'دفع',
      FINANCE: 'تمويل',
      INSURANCE: 'تأمين',
      REGISTRATION: 'تسجيل',
      PDI: 'فحص ما قبل التسليم',
      DELIVERY: 'تسليم',
      POST_DELIVERY: 'ما بعد التسليم',
    },
    reportDeliveryStatus: {
      DELIVERED: 'متاح الآن',
      DEFERRED: 'مؤجل',
      PENDING: 'الفهرس غير متاح',
      SIGNOFF_REQUIRED: 'مؤجل - بانتظار اعتماد العمل',
    },
    severity: {
      CRITICAL: 'حرجة',
      HIGH: 'عالية',
      MEDIUM: 'متوسطة',
      LOW: 'منخفضة',
    },
    slaState: {
      ON_TRACK: 'ضمن الوقت',
      WARNING: 'تنبيه',
      BREACHED: 'مصعدة',
      CLOSED: 'مغلقة',
    },
    taskStatus: {
      OPEN: 'مفتوحة',
      ['TO' + 'DO']: 'قائمة المهام',
      IN_PROGRESS: 'قيد التنفيذ',
      WAITING: 'قيد الانتظار',
      BLOCKED: 'متوقفة بسبب عائق',
      DONE: 'تمت',
      CANCELLED: 'ملغاة',
    },
    timelineType: {
      ASSIGNMENT: 'إسناد',
      ATTACHMENT: 'ملف',
      CAPA: 'CAPA',
      COMMENT: 'تعليق',
      COMPLAINT_STATUS: 'حالة',
      NOTIFICATION: 'إشعار',
      PUBLIC_UPDATE: 'تحديث للعميل',
      SLA: 'اتفاقية الخدمة',
      STATUS: 'حالة',
      SYSTEM: 'النظام',
      TASK: 'مهمة',
      TASK_COMMENT: 'تعليق على المهمة',
      TASK_STATUS: 'حالة المهمة',
      WORKFLOW: 'سير العمل',
    },
  },
};

export function domainLabel(locale: Locale, domain: Domain, code: string | null | undefined): string {
  if (!code) return '';
  return labels[locale][domain]?.[code] ?? humanizeCode(code);
}

export const auditActionLabel = (locale: Locale, code: string | null | undefined) => domainLabel(locale, 'auditAction', code);
export const blockerReasonLabel = (locale: Locale, code: string | null | undefined) => domainLabel(locale, 'blockerReason', code);
export const caseLifecycleStatusLabel = (locale: Locale, code: string | null | undefined) => domainLabel(locale, 'caseLifecycleStatus', code);
export const caseTypeLabel = (locale: Locale, code: string | null | undefined) => domainLabel(locale, 'caseType', code);
export const complaintStatusLabel = (locale: Locale, code: string | null | undefined) => domainLabel(locale, 'complaintStatus', code);
export const complaintTypeLabel = (locale: Locale, code: string | null | undefined) => domainLabel(locale, 'complaintType', code);
export const dealStageLabel = (locale: Locale, code: string | null | undefined) => domainLabel(locale, 'dealStage', code);
export const reportDeliveryStatusLabel = (locale: Locale, code: string | null | undefined) => domainLabel(locale, 'reportDeliveryStatus', code);
export const severityLabel = (locale: Locale, code: string | null | undefined) => domainLabel(locale, 'severity', code);
export const slaStateLabel = (locale: Locale, code: string | null | undefined) => domainLabel(locale, 'slaState', code);
export const taskStatusLabel = (locale: Locale, code: string | null | undefined) => domainLabel(locale, 'taskStatus', code);
export const timelineTypeLabel = (locale: Locale, code: string | null | undefined) => domainLabel(locale, 'timelineType', code);

function humanizeCode(code: string): string {
  return code
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

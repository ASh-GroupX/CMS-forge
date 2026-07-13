import type { Locale } from './staff-shell';

const en = {
  work: 'Work now',
  communication: 'Communication',
  details: 'Details',
  deadlineState: 'Deadline status (SLA)',
  capa: 'Corrective and preventive action (CAPA)',
  dms: 'Dealership data (DMS)',
};

export const complaintTabsText: Record<Locale, typeof en> = {
  en,
  ar: {
    work: 'العمل الآن',
    communication: 'التواصل',
    details: 'التفاصيل',
    deadlineState: 'حالة الموعد (SLA)',
    capa: 'الإجراء التصحيحي والوقائي (CAPA)',
    dms: 'بيانات الوكالة (DMS)',
  },
};

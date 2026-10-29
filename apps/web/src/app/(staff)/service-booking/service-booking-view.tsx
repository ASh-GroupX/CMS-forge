'use client';

import { ShieldAlert } from 'lucide-react';
import { useServiceBooking } from './service-booking-context';
import { TimelineTopbar } from './timeline-topbar';
import { TimelineSidebar } from './timeline-sidebar';
import { TimelineDayView } from './timeline-day-view';
import { TimelineWeekView } from './timeline-week-view';
import { TimelineMonthView } from './timeline-month-view';
import { NewAppointmentModal } from './new-appointment-modal';
import { AppointmentDetailModal } from './appointment-detail-modal';

export function ServiceBookingView() {
  const { view, userRules, locale } = useServiceBooking();
  const isAr = locale === 'ar';

  if (!userRules.canViewBookings) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl border border-line-subtle bg-surface shadow-xs">
        <ShieldAlert className="size-12 text-status-warning mb-3" />
        <h2 className="text-lg font-bold text-content-strong">
          {isAr ? 'لا تملك صلاحية عرض حجوزات الصيانة' : 'Access Restricted'}
        </h2>
        <p className="text-sm text-content-muted mt-1 max-w-md">
          {isAr
            ? 'تم تقييد صلاحية الوصول إلى نظام حجز الصيانة لحسابك. يرجى مراجعة مسؤول النظام لمنحك الصلاحية.'
            : 'You do not have permission to view or access service bookings. Please contact your system administrator.'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 w-full">
      <TimelineTopbar />
      <div className="flex flex-col lg:flex-row gap-5 items-start w-full">
        <TimelineSidebar />
        <div className="flex-1 w-full min-w-0">
          {view === 'day' && <TimelineDayView />}
          {view === 'week' && <TimelineWeekView />}
          {view === 'month' && <TimelineMonthView />}
        </div>
      </div>
      <NewAppointmentModal />
      <AppointmentDetailModal />
    </div>
  );
}

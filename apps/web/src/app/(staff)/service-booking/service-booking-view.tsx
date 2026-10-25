'use client';

import React from 'react';
import { useServiceBooking } from './service-booking-context';
import { TimelineTopbar } from './timeline-topbar';
import { TimelineSidebar } from './timeline-sidebar';
import { TimelineDayView } from './timeline-day-view';
import { TimelineWeekView } from './timeline-week-view';
import { TimelineMonthView } from './timeline-month-view';
import { NewAppointmentModal } from './new-appointment-modal';
import { AppointmentDetailModal } from './appointment-detail-modal';

export function ServiceBookingView() {
  const { view } = useServiceBooking();

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

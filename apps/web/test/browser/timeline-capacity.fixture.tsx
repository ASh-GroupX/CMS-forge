'use client';

import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { ServiceBookingProvider } from '../../src/app/(staff)/service-booking/service-booking-context';
import { TimelineDayView } from '../../src/app/(staff)/service-booking/timeline-day-view';
import { TimelineWeekView } from '../../src/app/(staff)/service-booking/timeline-week-view';
import { TimelineMonthView } from '../../src/app/(staff)/service-booking/timeline-month-view';
import { useServiceBooking } from '../../src/app/(staff)/service-booking/service-booking-context';
import type { ServiceAppointment } from '../../src/lib/staff-service-bookings-api';
import { getTodayDateString } from '../../src/app/(staff)/service-booking/service-booking-utils';

const date = new Date(Date.parse(`${getTodayDateString()}T00:00:00Z`) + 86400000).toISOString().slice(0, 10);
const historyDate = new Date(Date.parse(`${getTodayDateString()}T00:00:00Z`) - 86400000).toISOString().slice(0, 10);
const branch = { id: 'center_main', code: 'MAIN', nameEn: 'Main Service Center', nameAr: 'مركز الصيانة الرئيسي' };
const north = { id: 'center_north', code: 'NORTH', nameEn: 'North Service Center', nameAr: 'مركز الصيانة الشمالي' };
const appointments: ServiceAppointment[] = ['Customer One', 'Customer Two'].map((customerName, index) => ({
  id: `appointment-${index + 1}`, referenceNumber: `REF-${index + 1}`, branchId: branch.id,
  customerName, customerPhone: '+962790000001', carModelId: 'model-1', carModelName: 'Tiggo 8',
  maintenanceTypeId: 'service-1', maintenanceTypeName: 'A/C System Service', notes: '', date,
  startTime: '12:00', endTime: '12:15', durationMinutes: 15, status: 'BOOKED',
  createdAt: `${date}T08:00:00.000Z`, updatedAt: `${date}T08:00:00.000Z`,
}));

function HistoryControls() {
  const { appointments, setAppointments, setView, view } = useServiceBooking();
  return <>
    <div className="mb-4 flex gap-3">
      <button onClick={() => setAppointments((items) => items.map((item) => ({ ...item, status: 'CANCELLED' })))} type="button">Cancel booking</button>
      {(['day', 'week', 'month'] as const).map((target) => <button key={target} onClick={() => setView(target)} type="button">{target} view</button>)}
    </div>
    <p data-appointment-status={appointments[0]?.status} className="sr-only">{appointments[0]?.status}</p>
    {view === 'day' ? <TimelineDayView /> : view === 'week' ? <TimelineWeekView /> : <TimelineMonthView />}
  </>;
}

export function TimelineCapacityFixture({ locale, history = false }: { locale: 'en' | 'ar'; history?: boolean }) {
  const fixtureAppointments = history ? [{ ...appointments[0], date: historyDate, customerName: 'Historical Customer' }] : appointments;
  return (
    <div className="min-h-screen bg-surface-canvas p-4" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <ServiceBookingProvider initialAppointments={fixtureAppointments} initialBranches={[branch, north]} initialCarModels={[]}
        initialDate={history ? historyDate : date} initialMaintenanceTypes={[]} locale={locale}>
        {history ? <HistoryControls /> : <TimelineDayView />}
      </ServiceBookingProvider>
    </div>
  );
}

if (typeof document !== 'undefined') {
  hydrateRoot(document.getElementById('root')!, <TimelineCapacityFixture locale={document.documentElement.lang === 'ar' ? 'ar' : 'en'} history={document.documentElement.dataset.history === '1'} />);
}

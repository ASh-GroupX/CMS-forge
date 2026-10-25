import React from 'react';
import { headers } from 'next/headers';
import { resolveLocale, staffShellText } from '../../../i18n/staff-shell';
import { getComplaintFormOptions } from '../../../lib/staff-complaint-form-options-api';
import {
  fetchCarModels,
  fetchMaintenanceTypes,
  fetchServiceAppointments,
  type CarModel,
  type MaintenanceType,
  type ServiceAppointment,
} from '../../../lib/staff-service-bookings-api';
import { ServiceBookingProvider } from './service-booking-context';
import { ServiceBookingView } from './service-booking-view';

type SearchParams = {
  locale?: string | string[];
  date?: string;
};

export default async function ServiceBookingPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const requestHeaders = await headers();
  const locale = resolveLocale(params?.locale || requestHeaders.get('x-cms-locale') || undefined);
  const shell = staffShellText[locale];

  const todayStr = params?.date || new Date().toISOString().slice(0, 10);

  // Parallel data fetching
  const [formOptions, carModels, maintenanceTypes, appointments] = await Promise.all([
    getComplaintFormOptions().catch(() => null),
    fetchCarModels(false).catch(() => [] as CarModel[]),
    fetchMaintenanceTypes(false).catch(() => [] as MaintenanceType[]),
    fetchServiceAppointments({}).catch(() => [] as ServiceAppointment[]),
  ]);

  const branches = formOptions?.branches || [
    { id: 'branch_main', code: 'MAIN', nameEn: 'Main Branch', nameAr: 'الفرع الرئيسي' },
    { id: 'branch_north', code: 'NORTH', nameEn: 'North Branch', nameAr: 'فرع الشمال' },
  ];

  return (
    <section aria-label="Service Center Booking" className="grid gap-4 w-full" dir={shell.dir}>
      <ServiceBookingProvider
        initialAppointments={appointments}
        initialBranches={branches}
        initialCarModels={carModels}
        initialDate={todayStr}
        initialMaintenanceTypes={maintenanceTypes}
        locale={locale}
      >
        <ServiceBookingView />
      </ServiceBookingProvider>
    </section>
  );
}

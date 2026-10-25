import React from 'react';
import { headers } from 'next/headers';
import { resolveLocale } from '../../../../i18n/staff-shell';
import { serviceBookingText } from '../../../../i18n/staff-service-booking';
import { getComplaintFormOptions } from '../../../../lib/staff-complaint-form-options-api';
import {
  fetchBranchRules,
  fetchCarModels,
  fetchMaintenanceTypes,
  type CarModel,
  type DayRule,
  type MaintenanceType,
} from '../../../../lib/staff-service-bookings-api';
import { BookingSettingsView } from './booking-settings-view';

type SearchParams = { locale?: string | string[] };

export default async function BookingSettingsAdminPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const requestHeaders = await headers();
  const locale = resolveLocale(params?.locale || requestHeaders.get('x-cms-locale') || undefined);
  const t = serviceBookingText[locale] || serviceBookingText.en;

  const formOptions = await getComplaintFormOptions().catch(() => null);
  const branches = formOptions?.branches || [
    { id: 'branch_main', code: 'MAIN', nameEn: 'Main Branch', nameAr: 'الفرع الرئيسي' },
    { id: 'branch_north', code: 'NORTH', nameEn: 'North Branch', nameAr: 'فرع الشمال' },
  ];

  // Fetch data in parallel
  const [carModels, maintenanceTypes, ...rulesLists] = await Promise.all([
    fetchCarModels(false).catch(() => [] as CarModel[]),
    fetchMaintenanceTypes(false).catch(() => [] as MaintenanceType[]),
    ...branches.map((b) => fetchBranchRules(b.id).catch(() => [] as DayRule[])),
  ]);

  const rulesByBranch: Record<string, DayRule[]> = {};
  branches.forEach((b, idx) => {
    rulesByBranch[b.id] = rulesLists[idx] || [];
  });

  return (
    <section aria-label={t.adminSettings.title} className="w-full">
      <BookingSettingsView
        branches={branches}
        carModels={carModels}
        locale={locale}
        maintenanceTypes={maintenanceTypes}
        rulesByBranch={rulesByBranch}
        t={t}
      />
    </section>
  );
}

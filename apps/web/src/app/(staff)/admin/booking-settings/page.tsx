import React from 'react';
import { headers } from 'next/headers';
import { resolveLocale } from '../../../../i18n/staff-shell';
import { serviceBookingText } from '../../../../i18n/staff-service-booking';
import {
  fetchBranchRules,
  fetchCarModels,
  fetchMaintenanceTypes,
  fetchServiceCenters,
  type CarModel,
  type DayRule,
  type MaintenanceType,
  type ServiceCenter,
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
  const cookieHeader = requestHeaders.get('cookie') ?? '';
  const locale = resolveLocale(params?.locale || requestHeaders.get('x-cms-locale') || undefined);
  const t = serviceBookingText[locale] || serviceBookingText.en;

  const centers = await fetchServiceCenters(false, cookieHeader).catch(() => [] as ServiceCenter[]);

  // Fetch data in parallel with forwarded cookie header
  const [carModels, maintenanceTypes, ...rulesLists] = await Promise.all([
    fetchCarModels(false, cookieHeader).catch(() => [] as CarModel[]),
    fetchMaintenanceTypes(false, cookieHeader).catch(() => [] as MaintenanceType[]),
    ...centers.map((c) => fetchBranchRules(c.id, cookieHeader).catch(() => [] as DayRule[])),
  ]);

  const effectiveCenters: ServiceCenter[] = centers.length > 0 ? centers : [
    { id: 'center_main', code: 'MAIN_CENTER', nameEn: 'AMMAN Service Center', nameAr: 'مركز صيانة عمان', isActive: true },
    { id: 'center_north', code: 'NORTH_CENTER', nameEn: 'North Service Center', nameAr: 'مركز صيانة الشمال', isActive: true },
  ];

  const effectiveCarModels: CarModel[] = carModels.length > 0 ? carModels : [
    { id: 'car_tiggo8_pro', nameEn: 'Chery Tiggo 8 Pro', nameAr: 'شيري تيجو 8 برو', brand: 'Chery', isActive: true },
    { id: 'car_tiggo7_pro', nameEn: 'Chery Tiggo 7 Pro', nameAr: 'شيري تيجو 7 برو', brand: 'Chery', isActive: true },
    { id: 'car_tiggo4_pro', nameEn: 'Chery Tiggo 4 Pro', nameAr: 'شيري تيجو 4 برو', brand: 'Chery', isActive: true },
    { id: 'car_arrizo6_pro', nameEn: 'Chery Arrizo 6 Pro', nameAr: 'شيري أريزو 6 برو', brand: 'Chery', isActive: true },
    { id: 'car_model_patrol', nameEn: 'Nissan Patrol', nameAr: 'نيسان باترول', brand: 'Nissan', isActive: true },
    { id: 'car_model_sunny', nameEn: 'Nissan Sunny', nameAr: 'نيسان صني', brand: 'Nissan', isActive: true },
  ];

  const effectiveMaintenanceTypes: MaintenanceType[] = maintenanceTypes.length > 0 ? maintenanceTypes : [
    { id: 'maint_periodic_10k', nameEn: 'Periodic Maintenance 10,000 km', nameAr: 'صيانة دورية 10,000 كم', estimatedDurationMinutes: 30, isActive: true },
    { id: 'maint_periodic_20k', nameEn: 'Periodic Maintenance 20,000 km', nameAr: 'صيانة دورية 20,000 كم', estimatedDurationMinutes: 45, isActive: true },
    { id: 'maint_periodic_40k', nameEn: 'Periodic Maintenance 40,000 km', nameAr: 'صيانة دورية 40,000 كم', estimatedDurationMinutes: 60, isActive: true },
    { id: 'maint_oil_filter', nameEn: 'Oil and Filter Change', nameAr: 'تغيير زيت وفلتر', estimatedDurationMinutes: 30, isActive: true },
    { id: 'maint_brake_pads', nameEn: 'Brake Pads & Discs Service', nameAr: 'فحص واستبدال فحمات وفرامل', estimatedDurationMinutes: 45, isActive: true },
    { id: 'maint_general_check', nameEn: 'Comprehensive Inspection', nameAr: 'فحص شامل وفحص كمبيوتر', estimatedDurationMinutes: 60, isActive: true },
  ];

  const rulesByBranch: Record<string, DayRule[]> = {};
  effectiveCenters.forEach((c, idx) => {
    rulesByBranch[c.id] = rulesLists[idx] || [];
  });

  return (
    <section aria-label={t.adminSettings.title} className="w-full">
      <BookingSettingsView
        carModels={effectiveCarModels}
        centers={effectiveCenters}
        locale={locale}
        maintenanceTypes={effectiveMaintenanceTypes}
        rulesByBranch={rulesByBranch}
        t={t}
      />
    </section>
  );
}

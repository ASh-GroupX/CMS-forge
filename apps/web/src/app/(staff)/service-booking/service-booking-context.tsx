'use client';

import React, { createContext, useContext, useState, useTransition, type ReactNode } from 'react';
import type { Locale } from '../../../i18n/staff-shell';
import { serviceBookingText, type ServiceBookingCopy } from '../../../i18n/staff-service-booking';
import type {
  CarModel,
  DayAvailability,
  MaintenanceType,
  ServiceBookingLane,
  ServiceAppointment,
  UserBookingRule,
} from '../../../lib/staff-service-bookings-api';
import { fetchSlotAvailability } from '../../../lib/staff-service-bookings-api';

export type BranchOption = {
  id: string;
  code: string;
  nameEn: string;
  nameAr: string;
};

export type ServiceBookingView = 'day' | 'week' | 'month';

interface ServiceBookingContextType {
  locale: Locale;
  t: ServiceBookingCopy;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  view: ServiceBookingView;
  setView: (view: ServiceBookingView) => void;
  selectedBranchIds: string[];
  selectOnlyBranch: (id: string) => void;
  toggleBranch: (id: string) => void;
  branches: BranchOption[];
  bookingLanes: ServiceBookingLane[];
  carModels: CarModel[];
  maintenanceTypes: MaintenanceType[];
  appointments: ServiceAppointment[];
  slotAvailability: Record<string, DayAvailability | null>;
  setAppointments: React.Dispatch<React.SetStateAction<ServiceAppointment[]>>;
  isNewModalOpen: boolean;
  setIsNewModalOpen: (open: boolean) => void;
  isDetailModalOpen: boolean;
  setIsDetailModalOpen: (open: boolean) => void;
  selectedAppointment: ServiceAppointment | null;
  setSelectedAppointment: (apt: ServiceAppointment | null) => void;
  prefillSlot: { branchId: string; bookingLaneId: string; date: string; time: string } | null;
  openNewModalWithSlot: (slot: { branchId: string; bookingLaneId: string; date: string; time: string }) => void;
  isPending: boolean;
  startTransition: React.TransitionStartFunction;
  userRules: UserBookingRule;
}

const defaultUserRules: UserBookingRule = {
  userId: '',
  canViewBookings: true,
  canCreateBookings: true,
  canRescheduleBookings: true,
  canChangeStatus: true,
  canCancelBookings: true,
  canManageSettings: false,
};

const ServiceBookingContext = createContext<ServiceBookingContextType | null>(null);

export function ServiceBookingProvider({
  children,
  initialAppointments,
  initialBranches,
  initialBookingLanes,
  initialCarModels,
  initialDate,
  initialMaintenanceTypes,
  initialUserRules,
  locale,
}: {
  children: ReactNode;
  initialAppointments: ServiceAppointment[];
  initialBranches: BranchOption[];
  initialBookingLanes?: ServiceBookingLane[];
  initialCarModels: CarModel[];
  initialDate: string;
  initialMaintenanceTypes: MaintenanceType[];
  initialUserRules?: UserBookingRule;
  locale: Locale;
}) {
  const t = serviceBookingText[locale] || serviceBookingText.en;
  const userRules = initialUserRules || defaultUserRules;
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [view, setView] = useState<ServiceBookingView>('day');
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>(() =>
    initialBranches.map((branch) => branch.id),
  );
  const [appointments, setAppointments] = useState<ServiceAppointment[]>(initialAppointments);
  const [slotAvailability, setSlotAvailability] = useState<Record<string, DayAvailability | null>>({});
  const [branches, setBranches] = useState<BranchOption[]>(initialBranches);
  const [bookingLanes, setBookingLanes] = useState<ServiceBookingLane[]>(() => initialBookingLanes ?? initialBranches.map((branch) => ({
    id: `lane_${branch.id}`, serviceCenterId: branch.id, code: 'GENERAL', nameEn: 'General bookings', nameAr: 'الحجوزات العامة',
    maxDailyAppointments: 24, maxPerHour: 3, maxPerSlot: 1, position: 0, isActive: true, updatedAt: '',
  })));
  const [carModels, setCarModels] = useState<CarModel[]>(initialCarModels);
  const [maintenanceTypes, setMaintenanceTypes] = useState<MaintenanceType[]>(initialMaintenanceTypes);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<ServiceAppointment | null>(null);
  const [prefillSlot, setPrefillSlot] = useState<{ branchId: string; bookingLaneId: string; date: string; time: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  React.useEffect(() => {
    setAppointments(initialAppointments);
  }, [initialAppointments]);

  React.useEffect(() => {
    let active = true;
    setSlotAvailability({});
    void Promise.all(bookingLanes.filter((lane) => lane.isActive).map(async (lane) => [
      lane.id,
      await fetchSlotAvailability(lane.serviceCenterId, selectedDate, lane.id).catch(() => null),
    ] as const)).then((entries) => {
      if (active) setSlotAvailability(Object.fromEntries(entries));
    });
    return () => { active = false; };
  }, [appointments, bookingLanes, selectedDate]);

  React.useEffect(() => {
    setBranches(initialBranches);
    setSelectedBranchIds((selected) => {
      const activeIds = new Set(initialBranches.map((branch) => branch.id));
      const retained = selected.filter((id) => activeIds.has(id));
      return retained.length > 0 ? retained : initialBranches.map((branch) => branch.id);
    });
  }, [initialBranches]);

  React.useEffect(() => {
    if (initialBookingLanes) setBookingLanes(initialBookingLanes);
  }, [initialBookingLanes]);

  React.useEffect(() => {
    setCarModels(initialCarModels);
  }, [initialCarModels]);

  React.useEffect(() => {
    setMaintenanceTypes(initialMaintenanceTypes);
  }, [initialMaintenanceTypes]);

  const openNewModalWithSlot = (slot: { branchId: string; bookingLaneId: string; date: string; time: string }) => {
    setPrefillSlot(slot);
    setIsNewModalOpen(true);
  };

  const selectOnlyBranch = (id: string) => setSelectedBranchIds([id]);
  const toggleBranch = (id: string) => setSelectedBranchIds((selected) => {
    if (selected.includes(id)) {
      return selected.length === 1 ? selected : selected.filter((branchId) => branchId !== id);
    }
    return [...selected, id];
  });

  return (
    <ServiceBookingContext.Provider
      value={{
        appointments,
        bookingLanes,
        branches,
        carModels,
        isDetailModalOpen,
        isNewModalOpen,
        isPending,
        locale,
        maintenanceTypes,
        openNewModalWithSlot,
        prefillSlot,
        selectedAppointment,
        slotAvailability,
        selectedBranchIds,
        selectedDate,
        setAppointments,
        setIsDetailModalOpen,
        setIsNewModalOpen,
        setSelectedAppointment,
        selectOnlyBranch,
        setSelectedDate,
        setView,
        startTransition,
        t,
        toggleBranch,
        userRules,
        view,
      }}
    >
      {children}
    </ServiceBookingContext.Provider>
  );
}

export function useServiceBooking() {
  const context = useContext(ServiceBookingContext);
  if (!context) {
    throw new Error('useServiceBooking must be used within a ServiceBookingProvider');
  }
  return context;
}

'use client';

import React, { createContext, useContext, useState, useTransition, type ReactNode } from 'react';
import type { Locale } from '../../../i18n/staff-shell';
import { serviceBookingText, type ServiceBookingCopy } from '../../../i18n/staff-service-booking';
import type {
  CarModel,
  DayAvailability,
  MaintenanceType,
  ServiceAppointment,
  UserBookingRule,
} from '../../../lib/staff-service-bookings-api';

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
  selectedBranchId: string; // 'ALL' or specific branch ID
  setSelectedBranchId: (id: string) => void;
  branches: BranchOption[];
  carModels: CarModel[];
  maintenanceTypes: MaintenanceType[];
  appointments: ServiceAppointment[];
  setAppointments: React.Dispatch<React.SetStateAction<ServiceAppointment[]>>;
  isNewModalOpen: boolean;
  setIsNewModalOpen: (open: boolean) => void;
  isDetailModalOpen: boolean;
  setIsDetailModalOpen: (open: boolean) => void;
  selectedAppointment: ServiceAppointment | null;
  setSelectedAppointment: (apt: ServiceAppointment | null) => void;
  prefillSlot: { branchId: string; date: string; time: string } | null;
  openNewModalWithSlot: (slot: { branchId: string; date: string; time: string }) => void;
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
  initialCarModels,
  initialDate,
  initialMaintenanceTypes,
  initialUserRules,
  locale,
}: {
  children: ReactNode;
  initialAppointments: ServiceAppointment[];
  initialBranches: BranchOption[];
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
  const [selectedBranchId, setSelectedBranchId] = useState<string>('ALL');
  const [appointments, setAppointments] = useState<ServiceAppointment[]>(initialAppointments);
  const [branches, setBranches] = useState<BranchOption[]>(initialBranches);
  const [carModels, setCarModels] = useState<CarModel[]>(initialCarModels);
  const [maintenanceTypes, setMaintenanceTypes] = useState<MaintenanceType[]>(initialMaintenanceTypes);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<ServiceAppointment | null>(null);
  const [prefillSlot, setPrefillSlot] = useState<{ branchId: string; date: string; time: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  React.useEffect(() => {
    setAppointments(initialAppointments);
  }, [initialAppointments]);

  React.useEffect(() => {
    setBranches(initialBranches);
  }, [initialBranches]);

  React.useEffect(() => {
    setCarModels(initialCarModels);
  }, [initialCarModels]);

  React.useEffect(() => {
    setMaintenanceTypes(initialMaintenanceTypes);
  }, [initialMaintenanceTypes]);

  const openNewModalWithSlot = (slot: { branchId: string; date: string; time: string }) => {
    setPrefillSlot(slot);
    setIsNewModalOpen(true);
  };

  return (
    <ServiceBookingContext.Provider
      value={{
        appointments,
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
        selectedBranchId,
        selectedDate,
        setAppointments,
        setIsDetailModalOpen,
        setIsNewModalOpen,
        setSelectedAppointment,
        setSelectedBranchId,
        setSelectedDate,
        setView,
        startTransition,
        t,
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

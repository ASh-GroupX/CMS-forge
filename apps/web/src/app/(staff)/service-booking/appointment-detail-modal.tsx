'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import {
  AlertCircle,
  Car,
  Clock,
  Phone,
  Wrench,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { useServiceBooking } from './service-booking-context';
import { updateAppointmentStatusAction } from './actions';
import { AppointmentRescheduleForm } from './appointment-reschedule-form';
import type {
  ServiceAppointment,
  ServiceAppointmentStatus,
} from '../../../lib/staff-service-bookings-api';

const STATUS_OPTIONS: ServiceAppointmentStatus[] = [
  'BOOKED',
  'CONFIRMED',
  'IN_SERVICE',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
];

export function AppointmentDetailModal() {
  const {
    branches,
    isDetailModalOpen,
    locale,
    selectedAppointment,
    setAppointments,
    setIsDetailModalOpen,
    setSelectedAppointment,
    t,
  } = useServiceBooking();

  const isAr = locale === 'ar';
  const apt = selectedAppointment;

  const [activeTab, setActiveTab] = useState<'details' | 'reschedule' | 'status'>('details');
  const [targetStatus, setTargetStatus] = useState<ServiceAppointmentStatus>('CONFIRMED');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (apt) {
      setTargetStatus(apt.status);
      setActiveTab('details');
      setErrorMsg(null);
    }
  }, [apt]);

  if (!apt) return null;

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    const res = await updateAppointmentStatusAction(apt.id, targetStatus);
    setLoading(false);
    if (!res.success) {
      setErrorMsg(res.error || 'Failed to update status');
      return;
    }
    toast.success(t.modal.successUpdated);
    const updated = res.appointment as ServiceAppointment;
    setAppointments((prev) => prev.map((a) => (a.id === apt.id ? updated : a)));
    setSelectedAppointment(updated);
    setActiveTab('details');
  };

  return (
    <Dialog onOpenChange={setIsDetailModalOpen} open={isDetailModalOpen}>
      <DialogContent className="max-w-xl rounded-3xl p-6 sm:p-8">
        <DialogHeader className="mb-2">
          <div className="flex items-center justify-between">
            <span className="rounded-md bg-brand/10 px-2 py-0.5 text-xs font-mono font-bold text-brand">
              {apt.referenceNumber}
            </span>
            <span className="rounded-full bg-surface-canvas border border-line-subtle px-2.5 py-0.5 text-xs font-semibold">
              {t.status[apt.status]}
            </span>
          </div>
          <DialogTitle className="text-xl font-bold text-content-strong mt-2">
            {apt.customerName}
          </DialogTitle>
          <DialogDescription className="text-xs text-content-muted">
            {isAr ? apt.branchNameAr : apt.branchNameEn} • {apt.date} ({apt.startTime} - {apt.endTime})
          </DialogDescription>
        </DialogHeader>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 rounded-xl border border-line-subtle bg-surface-canvas/60 p-1 mb-4 text-xs font-semibold">
          <button
            className={`flex-1 rounded-lg py-1.5 transition-all ${
              activeTab === 'details'
                ? 'bg-surface text-content-strong shadow-xs'
                : 'text-content-muted hover:text-content-strong'
            }`}
            onClick={() => setActiveTab('details')}
            type="button"
          >
            {t.modal.detailsTab}
          </button>
          <button
            className={`flex-1 rounded-lg py-1.5 transition-all ${
              activeTab === 'reschedule'
                ? 'bg-surface text-content-strong shadow-xs'
                : 'text-content-muted hover:text-content-strong'
            }`}
            onClick={() => setActiveTab('reschedule')}
            type="button"
          >
            {t.modal.rescheduleTab}
          </button>
          <button
            className={`flex-1 rounded-lg py-1.5 transition-all ${
              activeTab === 'status'
                ? 'bg-surface text-content-strong shadow-xs'
                : 'text-content-muted hover:text-content-strong'
            }`}
            onClick={() => setActiveTab('status')}
            type="button"
          >
            {t.modal.statusTab}
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-status-error-border bg-status-error-bg p-3 text-xs font-semibold text-status-error">
            <AlertCircle className="size-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Details Tab */}
        {activeTab === 'details' && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3 rounded-2xl border border-line-subtle bg-surface-canvas/30 p-4">
              <div>
                <p className="text-[11px] font-semibold text-content-muted">{t.modal.customerPhone}</p>
                <p className="font-bold text-content-strong flex items-center gap-1.5 mt-0.5">
                  <Phone className="size-3.5 text-brand" />
                  <span dir="ltr">{apt.customerPhone}</span>
                </p>
              </div>

              <div>
                <p className="text-[11px] font-semibold text-content-muted">{t.modal.carModel}</p>
                <p className="font-bold text-content-strong flex items-center gap-1.5 mt-0.5">
                  <Car className="size-3.5 text-brand" />
                  <span>{apt.carModelName}</span>
                </p>
              </div>

              <div>
                <p className="text-[11px] font-semibold text-content-muted">{t.modal.maintenanceType}</p>
                <p className="font-bold text-content-strong flex items-center gap-1.5 mt-0.5">
                  <Wrench className="size-3.5 text-brand" />
                  <span>{apt.maintenanceTypeName}</span>
                </p>
              </div>

              <div>
                <p className="text-[11px] font-semibold text-content-muted">{t.modal.vin}</p>
                <p className="font-mono font-bold text-content-strong mt-0.5">
                  {apt.vin || '—'}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-line-subtle bg-surface-canvas/30 p-4">
              <p className="text-[11px] font-semibold text-content-muted mb-1">{t.modal.notes}</p>
              <p className="text-xs text-content-strong whitespace-pre-wrap">{apt.notes}</p>
            </div>
          </div>
        )}

        {/* Reschedule Tab */}
        {activeTab === 'reschedule' && (
          <AppointmentRescheduleForm
            appointment={apt}
            branches={branches}
            isAr={isAr}
            onSuccess={(updated) => {
              setAppointments((prev) => prev.map((a) => (a.id === apt.id ? updated : a)));
              setSelectedAppointment(updated);
              setActiveTab('details');
            }}
            t={t}
          />
        )}

        {/* Status Tab */}
        {activeTab === 'status' && (
          <form className="space-y-4" onSubmit={handleStatusUpdate}>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_OPTIONS.map((st) => (
                <button
                  className={`rounded-xl border p-2.5 text-xs font-bold text-start transition-all ${
                    targetStatus === st
                      ? 'border-brand bg-brand text-primary-foreground shadow-sm'
                      : 'border-line-subtle bg-surface hover:bg-surface-canvas text-content-strong'
                  }`}
                  key={st}
                  onClick={() => setTargetStatus(st)}
                  type="button"
                >
                  {t.status[st]}
                </button>
              ))}
            </div>

            <Button className="w-full rounded-xl bg-brand text-primary-foreground font-semibold" disabled={loading} type="submit">
              {loading ? t.modal.saving : t.modal.updateStatus}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

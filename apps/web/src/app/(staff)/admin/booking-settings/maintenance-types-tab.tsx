'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Clock, Edit2, Plus, ToggleLeft, ToggleRight, Wrench } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../../../components/ui/dialog';
import { saveMaintenanceTypeAction } from '../../service-booking/actions';
import type { MaintenanceType } from '../../../../lib/staff-service-bookings-api';
import type { Locale } from '../../../../i18n/staff-shell';
import type { ServiceBookingCopy } from '../../../../i18n/staff-service-booking';

export function MaintenanceTypesTab({
  initialMaintenanceTypes,
  locale,
  onMaintenanceTypesChange,
  t,
}: {
  initialMaintenanceTypes: MaintenanceType[];
  locale: Locale;
  onMaintenanceTypesChange?: (types: MaintenanceType[]) => void;
  t: ServiceBookingCopy;
}) {
  const isAr = locale === 'ar';
  const [typesList, setTypesList] = useState(initialMaintenanceTypes);

  React.useEffect(() => {
    setTypesList(initialMaintenanceTypes);
  }, [initialMaintenanceTypes]);

  const updateTypesList = (updater: (prev: MaintenanceType[]) => MaintenanceType[]) => {
    setTypesList((prev) => {
      const next = updater(prev);
      onMaintenanceTypesChange?.(next);
      return next;
    });
  };
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<MaintenanceType | null>(null);

  // Form State
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [duration, setDuration] = useState(30);
  const [saving, setSaving] = useState(false);

  const openAdd = () => {
    setEditingType(null);
    setNameEn('');
    setNameAr('');
    setDuration(30);
    setIsDialogOpen(true);
  };

  const openEdit = (m: MaintenanceType) => {
    setEditingType(m);
    setNameEn(m.nameEn);
    setNameAr(m.nameAr);
    setDuration(m.estimatedDurationMinutes);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEn.trim() || !nameAr.trim() || duration <= 0) {
      toast.error('All fields are required');
      return;
    }

    setSaving(true);
    const res = await saveMaintenanceTypeAction({
      id: editingType?.id,
      nameEn: nameEn.trim(),
      nameAr: nameAr.trim(),
      estimatedDurationMinutes: duration,
      isActive: editingType ? editingType.isActive : true,
    });
    setSaving(false);

    if (!res.success) {
      toast.error(res.error || 'Failed to save maintenance type');
      return;
    }

    toast.success(t.modal.successUpdated);
    setIsDialogOpen(false);
    if (editingType) {
      updateTypesList((prev) =>
        prev.map((m) =>
          m.id === editingType.id
            ? { ...m, ...res.type, nameEn, nameAr, estimatedDurationMinutes: duration }
            : m,
        ),
      );
    } else {
      updateTypesList((prev) => [
        ...prev,
        res.type || {
          id: `maint_${Date.now()}`,
          nameEn,
          nameAr,
          estimatedDurationMinutes: duration,
          isActive: true,
        },
      ]);
    }
  };

  const toggleActive = async (m: MaintenanceType) => {
    const nextState = !m.isActive;
    const res = await saveMaintenanceTypeAction({
      id: m.id,
      nameEn: m.nameEn,
      nameAr: m.nameAr,
      estimatedDurationMinutes: m.estimatedDurationMinutes,
      isActive: nextState,
    });
    if (!res.success) {
      toast.error(res.error || 'Failed to update status');
      return;
    }
    updateTypesList((prev) =>
      prev.map((item) => (item.id === m.id ? { ...item, isActive: nextState } : item)),
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-content-strong">
          {t.adminSettings.tabMaintenance}
        </h3>
        <Button
          className="flex items-center gap-2 rounded-xl bg-brand text-primary-foreground font-semibold"
          onClick={openAdd}
          size="sm"
          type="button"
        >
          <Plus className="size-4" />
          <span>{t.adminSettings.addMaintenance}</span>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        {typesList.map((m) => (
          <div
            className={`flex items-center justify-between rounded-2xl border p-4 shadow-2xs transition-all ${
              m.isActive
                ? 'border-line-subtle bg-surface'
                : 'border-line-subtle/50 bg-surface-canvas/40 opacity-60'
            }`}
            key={m.id}
          >
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-brand/10 p-2 text-brand">
                <Wrench className="size-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-content-strong">{m.nameEn}</p>
                <p className="text-[11px] text-content-muted" dir="rtl">
                  {m.nameAr}
                </p>
                <p className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-brand">
                  <Clock className="size-3" />
                  <span>{m.estimatedDurationMinutes} {t.appointmentCard.duration}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                className="rounded-lg p-1.5 text-content-muted hover:bg-surface-canvas hover:text-content-strong"
                onClick={() => openEdit(m)}
                type="button"
              >
                <Edit2 className="size-3.5" />
              </button>
              <button
                className="rounded-lg p-1.5 text-content-muted hover:bg-surface-canvas hover:text-brand"
                onClick={() => toggleActive(m)}
                type="button"
              >
                {m.isActive ? (
                  <ToggleRight className="size-5 text-status-success" />
                ) : (
                  <ToggleLeft className="size-5 text-content-muted" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Dialog */}
      <Dialog onOpenChange={setIsDialogOpen} open={isDialogOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editingType ? 'Edit Maintenance Type' : t.adminSettings.addMaintenance}
            </DialogTitle>
          </DialogHeader>

          <form className="space-y-3 mt-2" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold text-content-muted mb-1">
                {t.adminSettings.nameEn}
              </label>
              <input
                className="w-full rounded-xl border border-line-subtle bg-surface px-3 py-2 text-sm"
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="e.g. Periodic Service 10k"
                required
                type="text"
                value={nameEn}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-content-muted mb-1">
                {t.adminSettings.nameAr}
              </label>
              <input
                className="w-full rounded-xl border border-line-subtle bg-surface px-3 py-2 text-sm"
                dir="rtl"
                onChange={(e) => setNameAr(e.target.value)}
                placeholder="مثال: صيانة دورية 10,000 كم"
                required
                type="text"
                value={nameAr}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-content-muted mb-1">
                {t.adminSettings.durationMinutes}
              </label>
              <input
                className="w-full rounded-xl border border-line-subtle bg-surface px-3 py-2 text-sm"
                min={15}
                onChange={(e) => setDuration(Number(e.target.value))}
                required
                step={15}
                type="number"
                value={duration}
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-line-subtle">
              <Button onClick={() => setIsDialogOpen(false)} type="button" variant="outline">
                {t.modal.cancel}
              </Button>
              <Button className="bg-brand text-primary-foreground font-semibold" disabled={saving} type="submit">
                {saving ? t.modal.saving : t.modal.save}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Clock, Edit2, Plus, ToggleLeft, ToggleRight, Trash2, Wrench } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../../../components/ui/dialog';
import { saveMaintenanceTypeAction, deleteMaintenanceTypeAction } from '../../service-booking/actions';
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
    setTypesList((prev) => {
      const map = new Map(initialMaintenanceTypes.map((m) => [m.id, m]));
      for (const item of prev) {
        if (!map.has(item.id)) map.set(item.id, item);
      }
      return Array.from(map.values());
    });
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

  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [duration, setDuration] = useState(30);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const openAdd = () => {
    setEditingType(null); setNameEn(''); setNameAr(''); setDuration(30); setErrorMsg(null); setIsDialogOpen(true);
  };

  const openEdit = (m: MaintenanceType) => {
    setEditingType(m); setNameEn(m.nameEn); setNameAr(m.nameAr); setDuration(m.estimatedDurationMinutes); setErrorMsg(null); setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveNameEn = nameEn.trim() || nameAr.trim();
    const effectiveNameAr = nameAr.trim() || nameEn.trim();
    if (!effectiveNameEn) {
      const msg = isAr ? 'يرجى إدخال اسم نوع الصيانة' : 'Service name is required';
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }
    if (duration <= 0) {
      const msg = isAr ? 'يرجى إدخال مدة صحيحة' : 'Please enter a valid duration';
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    const res = await saveMaintenanceTypeAction({
      id: editingType?.id,
      nameEn: effectiveNameEn,
      nameAr: effectiveNameAr,
      estimatedDurationMinutes: duration,
      isActive: editingType ? editingType.isActive : true,
    });
    setSaving(false);

    if (!res.success) {
      const msg = res.error || (isAr ? 'فشل حفظ نوع الصيانة' : 'Failed to save maintenance type');
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    toast.success(
      isAr
        ? (editingType ? 'تم تحديث نوع الصيانة بنجاح' : 'تمت إضافة نوع الصيانة بنجاح')
        : (editingType ? 'Maintenance type updated successfully' : 'Maintenance type added successfully'),
    );
    setIsDialogOpen(false);
    if (editingType) {
      updateTypesList((prev) =>
        prev.map((m) =>
          m.id === editingType.id
            ? { ...m, ...res.type, nameEn: effectiveNameEn, nameAr: effectiveNameAr, estimatedDurationMinutes: duration }
            : m,
        ),
      );
    } else {
      updateTypesList((prev) => [
        ...prev,
        res.type || {
          id: `maint_${Date.now()}`,
          nameEn: effectiveNameEn,
          nameAr: effectiveNameAr,
          estimatedDurationMinutes: duration,
          isActive: true,
        },
      ]);
    }
  };

  const toggleActive = async (m: MaintenanceType) => {
    const nextState = !m.isActive;
    const res = await saveMaintenanceTypeAction({
      id: m.id, nameEn: m.nameEn, nameAr: m.nameAr, estimatedDurationMinutes: m.estimatedDurationMinutes, isActive: nextState,
    });
    if (!res.success) {
      toast.error(res.error || 'Failed to update status');
      return;
    }
    updateTypesList((prev) => prev.map((item) => (item.id === m.id ? { ...item, isActive: nextState } : item)));
  };

  const handleDelete = async (m: MaintenanceType) => {
    if (!window.confirm(isAr ? `هل أنت متأكد من حذف ${m.nameAr || m.nameEn} نهائياً؟` : `Are you sure you want to permanently delete ${m.nameEn}?`)) return;
    const res = await deleteMaintenanceTypeAction(m.id);
    if (!res.success) {
      toast.error(res.error || (isAr ? 'فشل حذف نوع الصيانة' : 'Failed to delete maintenance type'));
      return;
    }
    toast.success(isAr ? 'تم حذف نوع الصيانة بنجاح' : 'Maintenance type deleted successfully');
    updateTypesList((prev) => prev.filter((item) => item.id !== m.id));
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
                title={isAr ? 'تعديل' : 'Edit'}
                type="button"
              >
                <Edit2 className="size-3.5" />
              </button>
              <button
                className="rounded-lg p-1.5 text-content-muted hover:bg-surface-canvas hover:text-brand"
                onClick={() => toggleActive(m)}
                title={m.isActive ? (isAr ? 'تعطيل' : 'Deactivate') : (isAr ? 'تفعيل' : 'Activate')}
                type="button"
              >
                {m.isActive ? <ToggleRight className="size-5 text-status-success" /> : <ToggleLeft className="size-5 text-content-muted" />}
              </button>
              <button
                className="rounded-lg p-1.5 text-content-muted hover:bg-status-error-bg hover:text-status-error"
                onClick={() => handleDelete(m)}
                title={isAr ? 'حذف نهائي' : 'Delete permanently'}
                type="button"
              >
                <Trash2 className="size-3.5" />
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

          {errorMsg && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-2.5 text-xs font-semibold text-destructive">
              {errorMsg}
            </div>
          )}

          <form className="space-y-3 mt-2" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold text-content-muted mb-1">{t.adminSettings.nameEn}</label>
              <input className="w-full rounded-xl border border-line-subtle bg-surface px-3 py-2 text-sm" onChange={(e) => setNameEn(e.target.value)} placeholder="e.g. Periodic Service 10k" type="text" value={nameEn} />
            </div>
            <div>
              <label className="block text-xs font-bold text-content-muted mb-1">{t.adminSettings.nameAr}</label>
              <input className="w-full rounded-xl border border-line-subtle bg-surface px-3 py-2 text-sm" dir="rtl" onChange={(e) => setNameAr(e.target.value)} placeholder="مثال: صيانة دورية 10,000 كم" type="text" value={nameAr} />
            </div>
            <div>
              <label className="block text-xs font-bold text-content-muted mb-1">{t.adminSettings.durationMinutes}</label>
              <input className="w-full rounded-xl border border-line-subtle bg-surface px-3 py-2 text-sm" min={15} onChange={(e) => setDuration(Number(e.target.value))} required step={15} type="number" value={duration} />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-line-subtle">
              <Button onClick={() => setIsDialogOpen(false)} type="button" variant="outline">
                {t.modal.cancel}
              </Button>
              <Button className="bg-brand text-primary-foreground font-semibold" disabled={saving} type="submit">
                {saving ? t.modal.saving : (editingType ? t.adminSettings.saveChanges : t.adminSettings.addMaintenance)}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

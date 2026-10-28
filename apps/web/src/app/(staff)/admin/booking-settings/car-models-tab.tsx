'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Car, Edit2, Plus, Search, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../../../components/ui/dialog';
import { saveCarModelAction } from '../../service-booking/actions';
import type { CarModel } from '../../../../lib/staff-service-bookings-api';
import type { Locale } from '../../../../i18n/staff-shell';
import type { ServiceBookingCopy } from '../../../../i18n/staff-service-booking';

export function CarModelsTab({
  initialCarModels,
  locale,
  onCarModelsChange,
  t,
}: {
  initialCarModels: CarModel[];
  locale: Locale;
  onCarModelsChange?: (cars: CarModel[]) => void;
  t: ServiceBookingCopy;
}) {
  const isAr = locale === 'ar';
  const [carList, setCarList] = useState(initialCarModels);

  React.useEffect(() => {
    setCarList((prev) => {
      const map = new Map(initialCarModels.map((c) => [c.id, c]));
      for (const item of prev) {
        if (!map.has(item.id)) map.set(item.id, item);
      }
      return Array.from(map.values());
    });
  }, [initialCarModels]);

  const updateCarList = (updater: (prev: CarModel[]) => CarModel[]) => {
    setCarList((prev) => {
      const next = updater(prev);
      onCarModelsChange?.(next);
      return next;
    });
  };
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCar, setEditingCar] = useState<CarModel | null>(null);

  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [brand, setBrand] = useState('Nissan');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const openAdd = () => {
    setEditingCar(null); setNameEn(''); setNameAr(''); setBrand('Nissan'); setErrorMsg(null); setIsDialogOpen(true);
  };

  const openEdit = (car: CarModel) => {
    setEditingCar(car); setNameEn(car.nameEn); setNameAr(car.nameAr); setBrand(car.brand); setErrorMsg(null); setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveBrand = brand.trim() || 'Nissan';
    const effectiveNameEn = nameEn.trim() || nameAr.trim() || brand.trim();
    const effectiveNameAr = nameAr.trim() || nameEn.trim() || brand.trim();
    if (!effectiveNameEn) {
      const msg = isAr ? 'يرجى إدخال اسم الموديل أو الماركة' : 'Model or brand name is required';
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    const res = await saveCarModelAction({
      id: editingCar?.id,
      nameEn: effectiveNameEn,
      nameAr: effectiveNameAr,
      brand: effectiveBrand,
      isActive: editingCar ? editingCar.isActive : true,
    });
    setSaving(false);

    if (!res.success) {
      const msg = res.error || (isAr ? 'فشل حفظ موديل السيارة' : 'Failed to save car model');
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    toast.success(
      isAr
        ? (editingCar ? 'تم تحديث موديل السيارة بنجاح' : 'تمت إضافة موديل السيارة بنجاح')
        : (editingCar ? 'Car model updated successfully' : 'Car model added successfully'),
    );
    setIsDialogOpen(false);
    if (editingCar) {
      updateCarList((prev) =>
        prev.map((c) =>
          c.id === editingCar.id ? { ...c, ...res.model, nameEn: effectiveNameEn, nameAr: effectiveNameAr, brand: effectiveBrand } : c,
        ),
      );
    } else {
      updateCarList((prev) => [
        ...prev,
        res.model || {
          id: `car_${Date.now()}`,
          nameEn: effectiveNameEn,
          nameAr: effectiveNameAr,
          brand: effectiveBrand,
          isActive: true,
        },
      ]);
    }
  };

  const toggleActive = async (car: CarModel) => {
    const nextState = !car.isActive;
    const res = await saveCarModelAction({ id: car.id, nameEn: car.nameEn, nameAr: car.nameAr, brand: car.brand, isActive: nextState });
    if (!res.success) {
      toast.error(res.error || 'Failed to update status');
      return;
    }
    updateCarList((prev) => prev.map((c) => (c.id === car.id ? { ...c, isActive: nextState } : c)));
  };

  const filtered = carList.filter(
    (c) =>
      c.nameEn.toLowerCase().includes(search.toLowerCase()) ||
      c.nameAr.toLowerCase().includes(search.toLowerCase()) ||
      c.brand.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      {/* Top search and Add button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="absolute start-3 top-2.5 size-4 text-content-muted" />
          <input
            className="w-full rounded-xl border border-line-subtle bg-surface px-3 py-2 ps-9 text-xs focus:border-brand focus:outline-none"
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.modal.searchCarModel}
            type="text"
            value={search}
          />
        </div>

        <Button
          className="flex items-center gap-2 rounded-xl bg-brand text-primary-foreground font-semibold"
          onClick={openAdd}
          size="sm"
          type="button"
        >
          <Plus className="size-4" />
          <span>{t.adminSettings.addCar}</span>
        </Button>
      </div>

      {/* Grid of car cards */}
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        {filtered.map((car) => (
          <div
            className={`flex items-center justify-between rounded-2xl border p-4 shadow-2xs transition-all ${
              car.isActive
                ? 'border-line-subtle bg-surface'
                : 'border-line-subtle/50 bg-surface-canvas/40 opacity-60'
            }`}
            key={car.id}
          >
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-brand/10 p-2 text-brand">
                <Car className="size-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-content-strong">
                  {car.brand} {car.nameEn}
                </p>
                <p className="text-[11px] text-content-muted" dir="rtl">
                  {car.nameAr}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                className="rounded-lg p-1.5 text-content-muted hover:bg-surface-canvas hover:text-content-strong"
                onClick={() => openEdit(car)}
                type="button"
              >
                <Edit2 className="size-3.5" />
              </button>
              <button
                className="rounded-lg p-1.5 text-content-muted hover:bg-surface-canvas hover:text-brand"
                onClick={() => toggleActive(car)}
                type="button"
              >
                {car.isActive ? (
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
              {editingCar ? 'Edit Car Model' : t.adminSettings.addCar}
            </DialogTitle>
          </DialogHeader>

          {errorMsg && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-2.5 text-xs font-semibold text-destructive">
              {errorMsg}
            </div>
          )}

          <form className="space-y-3 mt-2" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold text-content-muted mb-1">
                {t.adminSettings.brand}
              </label>
              <input
                className="w-full rounded-xl border border-line-subtle bg-surface px-3 py-2 text-sm"
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Nissan"
                required
                type="text"
                value={brand}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-content-muted mb-1">
                {t.adminSettings.nameEn}
              </label>
              <input
                className="w-full rounded-xl border border-line-subtle bg-surface px-3 py-2 text-sm"
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="e.g. Patrol"
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
                placeholder="مثال: باترول"
                type="text"
                value={nameAr}
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-line-subtle">
              <Button onClick={() => setIsDialogOpen(false)} type="button" variant="outline">
                {t.modal.cancel}
              </Button>
              <Button className="bg-brand text-primary-foreground font-semibold" disabled={saving} type="submit">
                {saving ? t.modal.saving : (editingCar ? t.adminSettings.saveChanges : t.adminSettings.addCar)}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

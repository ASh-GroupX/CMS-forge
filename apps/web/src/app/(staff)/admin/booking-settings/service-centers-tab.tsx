'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Building2, Plus, Edit2, Trash2, CheckCircle2, Phone, MapPin } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { ServiceCenterDialog } from './service-center-dialog';
import { saveServiceCenterAction, deleteServiceCenterAction } from '../../service-booking/actions';
import type { ServiceCenter } from '../../../../lib/staff-service-bookings-api';
import type { Locale } from '../../../../i18n/staff-shell';
import type { ServiceBookingCopy } from '../../../../i18n/staff-service-booking';

export function ServiceCentersTab({
  centers,
  initialCenters,
  locale,
  onCentersChange,
  t,
}: {
  centers?: ServiceCenter[];
  initialCenters?: ServiceCenter[];
  locale: Locale;
  onCentersChange?: (centers: ServiceCenter[]) => void;
  t?: ServiceBookingCopy;
}) {
  const isAr = locale === 'ar';
  const [centerList, setCenterList] = useState<ServiceCenter[]>(centers || initialCenters || []);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCenter, setEditingCenter] = useState<ServiceCenter | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  React.useEffect(() => {
    setCenterList(centers || initialCenters || []);
  }, [centers, initialCenters]);

  const updateCenterList = (updater: (prev: ServiceCenter[]) => ServiceCenter[]) => {
    setCenterList((prev) => {
      const next = updater(prev);
      onCentersChange?.(next);
      return next;
    });
  };

  const openAddDialog = () => {
    setEditingCenter(null);
    setApiError(null);
    setDialogOpen(true);
  };

  const openEditDialog = (center: ServiceCenter) => {
    setEditingCenter(center);
    setApiError(null);
    setDialogOpen(true);
  };

  const handleSave = async (payload: { code: string; nameEn: string; nameAr: string; address?: string | undefined; phone?: string | undefined }) => {
    setLoading(true);
    setApiError(null);
    const body = {
      ...(editingCenter ? { id: editingCenter.id } : {}),
      ...payload,
      isActive: true,
    };

    const res = await saveServiceCenterAction(body);
    setLoading(false);

    if (!res.success) {
      const msg = res.error || (isAr ? 'فشل حفظ مركز الخدمة' : 'Failed to save service center');
      setApiError(msg);
      toast.error(msg);
      return;
    }

    toast.success(editingCenter ? (isAr ? 'تم تحديث مركز الخدمة' : 'Service center updated') : (isAr ? 'تمت إضافة مركز الخدمة بنجاح' : 'Service center created successfully'));
    setDialogOpen(false);

    if (editingCenter) {
      updateCenterList((prev) =>
        prev.map((c) => (c.id === editingCenter.id ? { ...c, ...res.center, code: payload.code, nameEn: payload.nameEn, nameAr: payload.nameAr, address: payload.address || null, phone: payload.phone || null } : c))
      );
    } else {
      updateCenterList((prev) => [
        ...prev,
        res.center || { id: `center_${Date.now()}`, code: payload.code, nameEn: payload.nameEn, nameAr: payload.nameAr, address: payload.address || null, phone: payload.phone || null, isActive: true },
      ]);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(isAr ? 'هل أنت متأكد من تعطيل هذا المركز؟' : 'Are you sure you want to deactivate this service center?')) {
      return;
    }

    const res = await deleteServiceCenterAction(id);
    if (!res.success) {
      toast.error(res.error || 'Failed to deactivate service center');
      return;
    }
    toast.success(isAr ? 'تم تعطيل مركز الخدمة' : 'Service center deactivated');
    updateCenterList((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-content-strong">
            {isAr ? 'مراكز الصيانة وحجز المواعيد' : 'Service Centers for Booking'}
          </h2>
          <p className="text-xs text-content-muted">
            {isAr
              ? 'مراكز الخدمة المخصصة لحجز مواعيد الصيانة واستقبال المركبات بشكل منفصل عن فروع الشركة.'
              : 'Independent service centers dedicated solely to maintenance bookings.'}
          </p>
        </div>

        <Button
          className="flex items-center gap-1.5 rounded-xl bg-brand text-xs font-bold text-primary-foreground shadow-sm hover:opacity-95"
          onClick={openAddDialog}
          type="button"
        >
          <Plus className="size-4" />
          <span>{isAr ? 'إضافة مركز خدمة جديد' : 'Add Service Center'}</span>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {centerList.map((center) => (
          <div
            className="flex flex-col justify-between rounded-2xl border border-line-subtle bg-surface p-5 shadow-xs transition-shadow hover:shadow-md"
            key={center.id}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="rounded-xl bg-brand/10 p-2 text-brand">
                    <Building2 className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-content-strong">{isAr ? center.nameAr : center.nameEn}</h3>
                    <span className="font-mono text-[11px] font-semibold text-content-muted">{center.code}</span>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 rounded-full bg-status-success-bg px-2 py-0.5 text-[10px] font-bold text-status-success">
                  <CheckCircle2 className="size-3" />
                  <span>{isAr ? 'نشط' : 'Active'}</span>
                </span>
              </div>

              <div className="rounded-xl bg-surface-canvas/60 p-3 text-xs space-y-1.5">
                <div className="flex items-center gap-2 text-content-muted">
                  <span className="font-semibold">{isAr ? 'الاسم البديل:' : 'Alt Name:'}</span>
                  <span className="text-content-strong">{isAr ? center.nameEn : center.nameAr}</span>
                </div>
                {center.phone && (
                  <div className="flex items-center gap-2 text-content-muted">
                    <Phone className="size-3.5" />
                    <span className="font-mono text-content-strong" dir="ltr">{center.phone}</span>
                  </div>
                )}
                {center.address && (
                  <div className="flex items-center gap-2 text-content-muted">
                    <MapPin className="size-3.5 shrink-0" />
                    <span className="truncate text-content-strong">{center.address}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2 border-t border-line-subtle/60 pt-3">
              <Button
                className="flex items-center gap-1 rounded-xl text-xs"
                onClick={() => openEditDialog(center)}
                size="sm"
                variant="outline"
              >
                <Edit2 className="size-3" />
                <span>{isAr ? 'تعديل' : 'Edit'}</span>
              </Button>
              <Button
                className="flex items-center gap-1 rounded-xl text-xs text-status-error hover:bg-status-error-bg hover:text-status-error"
                onClick={() => handleDelete(center.id)}
                size="sm"
                variant="ghost"
              >
                <Trash2 className="size-3" />
                <span>{isAr ? 'حذف' : 'Deactivate'}</span>
              </Button>
            </div>
          </div>
        ))}
      </div>

      <ServiceCenterDialog
        apiError={apiError}
        editingCenter={editingCenter}
        isAr={isAr}
        isOpen={dialogOpen}
        loading={loading}
        onOpenChange={setDialogOpen}
        onSave={handleSave}
      />
    </div>
  );
}

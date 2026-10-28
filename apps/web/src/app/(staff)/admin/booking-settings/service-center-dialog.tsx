'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../../../../components/ui/button';
import { ActionDialog } from '../../../../components/shared/action-dialog';
import type { ServiceCenter } from '../../../../lib/staff-service-bookings-api';

export function ServiceCenterDialog({
  isOpen,
  onOpenChange,
  editingCenter,
  onSave,
  loading,
  isAr,
  apiError,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingCenter: ServiceCenter | null;
  onSave: (payload: { code: string; nameEn: string; nameAr: string; address?: string | undefined; phone?: string | undefined }) => void;
  loading: boolean;
  isAr: boolean;
  apiError?: string | null | undefined;
}) {
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    setLocalError(null);
    if (editingCenter) {
      setNameEn(editingCenter.nameEn);
      setNameAr(editingCenter.nameAr);
      setCode(editingCenter.code);
      setAddress(editingCenter.address || '');
      setPhone(editingCenter.phone || '');
    } else {
      setNameEn('');
      setNameAr('');
      setCode(`CTR_${Date.now().toString().slice(-4)}`);
      setAddress('');
      setPhone('');
    }
  }, [editingCenter, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveNameAr = nameAr.trim() || nameEn.trim();
    const effectiveNameEn = nameEn.trim() || nameAr.trim();
    const effectiveCode = code.trim().toUpperCase() || (editingCenter?.code ?? `CTR_${Date.now().toString().slice(-4)}`);
    if (!effectiveNameAr && !effectiveNameEn) {
      setLocalError(isAr ? 'يرجى إدخال اسم مركز الخدمة' : 'Service center name is required');
      return;
    }
    setLocalError(null);
    onSave({
      code: effectiveCode,
      nameEn: effectiveNameEn,
      nameAr: effectiveNameAr,
      address: address.trim() || undefined,
      phone: phone.trim() || undefined,
    });
  };

  return (
    <ActionDialog
      footer={
        <div className="flex w-full items-center justify-end gap-2">
          <Button className="rounded-xl" onClick={() => onOpenChange(false)} type="button" variant="outline">
            {isAr ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button className="rounded-xl bg-brand text-primary-foreground shadow-sm" disabled={loading} onClick={handleSubmit} type="button">
            {loading ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'حفظ مركز الخدمة' : 'Save Center')}
          </Button>
        </div>
      }
      open={isOpen}
      title={editingCenter ? (isAr ? 'تعديل بيانات مركز الخدمة' : 'Edit Service Center') : (isAr ? 'إضافة مركز خدمة جديد' : 'Add New Service Center')}
      onOpenChange={onOpenChange}
    >
      {(localError || apiError) && (
        <div className="mb-3 rounded-xl border border-destructive/20 bg-destructive/10 p-2.5 text-xs font-semibold text-destructive">
          {localError || apiError}
        </div>
      )}

      <form className="space-y-4 py-2" onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-content-muted">{isAr ? 'اسم المركز (بالعربية)' : 'Name (Arabic)'}</label>
            <input
              className="mt-1 w-full rounded-xl border border-line-subtle bg-surface-canvas px-3 py-2 text-xs font-bold"
              dir="rtl"
              onChange={(e) => setNameAr(e.target.value)}
              placeholder="مثال: مركز خدمة خلدة"
              type="text"
              value={nameAr}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-content-muted">{isAr ? 'اسم المركز (بالإنجليزية)' : 'Name (English)'}</label>
            <input
              className="mt-1 w-full rounded-xl border border-line-subtle bg-surface-canvas px-3 py-2 text-xs font-bold"
              dir="ltr"
              onChange={(e) => setNameEn(e.target.value)}
              placeholder="e.g. Khalda Service Center"
              type="text"
              value={nameEn}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-content-muted">{isAr ? 'كود المركز *' : 'Center Code *'}</label>
            <input
              className="mt-1 w-full rounded-xl border border-line-subtle bg-surface-canvas px-3 py-2 text-xs font-mono font-bold"
              onChange={(e) => setCode(e.target.value)}
              placeholder="CTR_MAIN"
              required
              type="text"
              value={code}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-content-muted">{isAr ? 'رقم الهاتف' : 'Phone'}</label>
            <input
              className="mt-1 w-full rounded-xl border border-line-subtle bg-surface-canvas px-3 py-2 text-xs font-mono"
              dir="ltr"
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+962 6 000 0000"
              type="tel"
              value={phone}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-content-muted">{isAr ? 'العنوان والموقع' : 'Address / Location'}</label>
          <input
            className="mt-1 w-full rounded-xl border border-line-subtle bg-surface-canvas px-3 py-2 text-xs"
            onChange={(e) => setAddress(e.target.value)}
            placeholder={isAr ? 'شارع وصفي التل، عمان' : 'Wasfi Al-Tal St, Amman'}
            type="text"
            value={address}
          />
        </div>
      </form>
    </ActionDialog>
  );
}

'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Building2, Save } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { updateBranchNameAction } from '../../service-booking/actions';
import type { Locale } from '../../../../i18n/staff-shell';
import type { ServiceBookingCopy } from '../../../../i18n/staff-service-booking';

export function BranchNamesTab({
  branches,
  locale,
  t,
}: {
  branches: Array<{ id: string; code: string; nameEn: string; nameAr: string }>;
  locale: Locale;
  t: ServiceBookingCopy;
}) {
  const isAr = locale === 'ar';
  const [branchList, setBranchList] = useState(branches);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleUpdate = async (id: string, nameEn: string, nameAr: string) => {
    setLoadingId(id);
    const res = await updateBranchNameAction(id, nameEn, nameAr);
    setLoadingId(null);
    if (!res.success) {
      toast.error(res.error || 'Failed to update branch name');
      return;
    }
    toast.success(isAr ? 'تم تحديث اسم المركز بنجاح' : 'Service center name updated successfully');
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {branchList.map((branch) => (
          <div
            className="flex flex-col justify-between rounded-2xl border border-line-subtle bg-surface p-5 shadow-xs"
            key={branch.id}
          >
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="size-5 text-brand" />
                <h3 className="font-bold text-base text-content-strong">
                  {branch.code} ({branch.nameEn})
                </h3>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-content-muted mb-1">
                    {t.adminSettings.nameEn}
                  </label>
                  <input
                    className="w-full rounded-xl border border-line-subtle bg-surface-canvas px-3 py-2 text-sm focus:border-brand focus:outline-none"
                    onChange={(e) =>
                      setBranchList((prev) =>
                        prev.map((b) => (b.id === branch.id ? { ...b, nameEn: e.target.value } : b)),
                      )
                    }
                    type="text"
                    value={branch.nameEn}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-content-muted mb-1">
                    {t.adminSettings.nameAr}
                  </label>
                  <input
                    className="w-full rounded-xl border border-line-subtle bg-surface-canvas px-3 py-2 text-sm focus:border-brand focus:outline-none"
                    dir="rtl"
                    onChange={(e) =>
                      setBranchList((prev) =>
                        prev.map((b) => (b.id === branch.id ? { ...b, nameAr: e.target.value } : b)),
                      )
                    }
                    type="text"
                    value={branch.nameAr}
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-line-subtle flex justify-end">
              <Button
                className="flex items-center gap-2 rounded-xl bg-brand text-primary-foreground font-semibold"
                disabled={loadingId === branch.id}
                onClick={() => handleUpdate(branch.id, branch.nameEn, branch.nameAr)}
                size="sm"
                type="button"
              >
                <Save className="size-3.5" />
                <span>{loadingId === branch.id ? t.modal.saving : t.adminSettings.saveChanges}</span>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Clock, Save } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { saveBranchRulesAction } from '../../service-booking/actions';
import type { DayRule } from '../../../../lib/staff-service-bookings-api';
import type { Locale } from '../../../../i18n/staff-shell';
import type { ServiceBookingCopy } from '../../../../i18n/staff-service-booking';

export function BranchHoursTab({
  branches,
  initialRulesByBranch,
  locale,
  t,
}: {
  branches: Array<{ id: string; code: string; nameEn: string; nameAr: string }>;
  initialRulesByBranch: Record<string, DayRule[]>;
  locale: Locale;
  t: ServiceBookingCopy;
}) {
  const isAr = locale === 'ar';
  const [activeBranchId, setActiveBranchId] = useState(branches[0]?.id || '');
  const [rulesByBranch, setRulesByBranch] = useState(initialRulesByBranch);
  const [saving, setSaving] = useState(false);

  const currentRules = rulesByBranch[activeBranchId] || [];

  const updateRuleField = (dayOfWeek: number, field: keyof DayRule, value: any) => {
    setRulesByBranch((prev) => {
      const list = prev[activeBranchId] || [];
      const updated = list.map((r) => (r.dayOfWeek === dayOfWeek ? { ...r, [field]: value } : r));
      return { ...prev, [activeBranchId]: updated };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await saveBranchRulesAction(activeBranchId, currentRules);
    setSaving(false);
    if (!res.success) {
      toast.error(res.error || 'Failed to save rules');
      return;
    }
    toast.success(t.modal.successUpdated);
  };

  return (
    <div className="space-y-4">
      {/* Branch selector */}
      <div className="flex items-center gap-2">
        {branches.map((b) => (
          <button
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeBranchId === b.id
                ? 'bg-brand text-primary-foreground shadow-sm'
                : 'border border-line-subtle bg-surface text-content-muted hover:text-content-strong'
            }`}
            key={b.id}
            onClick={() => setActiveBranchId(b.id)}
            type="button"
          >
            {isAr ? b.nameAr : b.nameEn}
          </button>
        ))}
      </div>

      {/* Rules Table */}
      <div className="rounded-2xl border border-line-subtle bg-surface shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead className="border-b border-line-subtle bg-surface-canvas/60 text-content-muted">
              <tr>
                <th className="p-3 text-start font-bold">Day</th>
                <th className="p-3 text-center font-bold">Status</th>
                <th className="p-3 text-start font-bold">{t.adminSettings.from}</th>
                <th className="p-3 text-start font-bold">{t.adminSettings.to}</th>
                <th className="p-3 text-start font-bold">{t.adminSettings.maxDaily}</th>
                <th className="p-3 text-start font-bold">{t.adminSettings.maxPerHour}</th>
                <th className="p-3 text-start font-bold">{t.adminSettings.maxPerSlot}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-subtle">
              {currentRules.map((rule) => {
                const dayName = t.adminSettings.days[rule.dayOfWeek] || `Day ${rule.dayOfWeek}`;
                return (
                  <tr className="transition-colors hover:bg-surface-canvas/30" key={rule.dayOfWeek}>
                    <td className="p-3 font-bold text-content-strong whitespace-nowrap">
                      {dayName}
                    </td>

                    <td className="p-3 text-center">
                      <button
                        className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors ${
                          rule.isOpen
                            ? 'bg-status-success-bg text-status-success'
                            : 'bg-status-error-bg text-status-error'
                        }`}
                        onClick={() => updateRuleField(rule.dayOfWeek, 'isOpen', !rule.isOpen)}
                        type="button"
                      >
                        {rule.isOpen ? t.adminSettings.isOpen : t.adminSettings.closed}
                      </button>
                    </td>

                    <td className="p-3">
                      <input
                        className="rounded-lg border border-line-subtle bg-surface-canvas px-2 py-1 text-xs font-mono disabled:opacity-50"
                        disabled={!rule.isOpen}
                        onChange={(e) => updateRuleField(rule.dayOfWeek, 'startTime', e.target.value)}
                        type="time"
                        value={rule.startTime}
                      />
                    </td>

                    <td className="p-3">
                      <input
                        className="rounded-lg border border-line-subtle bg-surface-canvas px-2 py-1 text-xs font-mono disabled:opacity-50"
                        disabled={!rule.isOpen}
                        onChange={(e) => updateRuleField(rule.dayOfWeek, 'endTime', e.target.value)}
                        type="time"
                        value={rule.endTime}
                      />
                    </td>

                    <td className="p-3">
                      <input
                        className="w-16 rounded-lg border border-line-subtle bg-surface-canvas px-2 py-1 text-xs font-bold disabled:opacity-50"
                        disabled={!rule.isOpen}
                        min={0}
                        onChange={(e) => updateRuleField(rule.dayOfWeek, 'maxDailyAppointments', Number(e.target.value))}
                        type="number"
                        value={rule.maxDailyAppointments}
                      />
                    </td>

                    <td className="p-3">
                      <input
                        className="w-16 rounded-lg border border-line-subtle bg-surface-canvas px-2 py-1 text-xs font-bold disabled:opacity-50"
                        disabled={!rule.isOpen}
                        min={1}
                        onChange={(e) => updateRuleField(rule.dayOfWeek, 'maxPerHour', Number(e.target.value))}
                        type="number"
                        value={rule.maxPerHour}
                      />
                    </td>

                    <td className="p-3">
                      <input
                        className="w-16 rounded-lg border border-line-subtle bg-surface-canvas px-2 py-1 text-xs font-bold disabled:opacity-50"
                        disabled={!rule.isOpen}
                        min={1}
                        onChange={(e) => updateRuleField(rule.dayOfWeek, 'maxPerSlot', Number(e.target.value))}
                        type="number"
                        value={rule.maxPerSlot}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-line-subtle flex justify-end bg-surface-canvas/20">
          <Button
            className="flex items-center gap-2 rounded-xl bg-brand font-semibold text-primary-foreground shadow-sm"
            disabled={saving}
            onClick={handleSave}
            type="button"
          >
            <Save className="size-4" />
            <span>{saving ? t.modal.saving : t.adminSettings.saveChanges}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

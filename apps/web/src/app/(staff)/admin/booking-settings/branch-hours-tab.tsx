'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Clock, Plus, Save, Sparkles } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { BranchHoursAddDialog } from './branch-hours-add-dialog';
import { saveBranchRulesAction, initWeekRulesAction } from '../../service-booking/actions';
import type { DayRule } from '../../../../lib/staff-service-bookings-api';
import type { Locale } from '../../../../i18n/staff-shell';
import type { ServiceBookingCopy } from '../../../../i18n/staff-service-booking';

type CenterItem = { id: string; code: string; nameEn: string; nameAr: string };

interface BranchHoursTabProps {
  branches?: CenterItem[];
  centers?: CenterItem[];
  initialRulesByBranch: Record<string, DayRule[]>;
  locale: Locale;
  t: ServiceBookingCopy;
}

export function BranchHoursTab({ branches, centers, initialRulesByBranch, locale, t }: BranchHoursTabProps) {
  const isAr = locale === 'ar';
  const centerList = centers || branches || [];
  const [activeBranchId, setActiveBranchId] = useState(centerList[0]?.id || '');
  const [rulesByBranch, setRulesByBranch] = useState(initialRulesByBranch);
  const [saving, setSaving] = useState(false);
  const [initing, setIniting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  React.useEffect(() => {
    setRulesByBranch(initialRulesByBranch);
  }, [initialRulesByBranch]);

  React.useEffect(() => {
    if (!activeBranchId && centerList[0]?.id) {
      setActiveBranchId(centerList[0].id);
    }
  }, [centerList, activeBranchId]);

  const currentCenterId = activeBranchId || centerList[0]?.id || '';
  const currentRules = (rulesByBranch[currentCenterId] || []).sort(
    (a, b) => a.dayOfWeek - b.dayOfWeek
  );

  const updateRuleField = (day: number, field: keyof DayRule, value: any) => {
    if (!currentCenterId) return;
    setRulesByBranch((prev) => {
      const list = prev[currentCenterId] || [];
      const updated = list.map((r) => (r.dayOfWeek === day ? { ...r, [field]: value } : r));
      return { ...prev, [currentCenterId]: updated };
    });
  };

  const handleSave = async () => {
    if (!currentCenterId) return;
    setSaving(true);
    const res = await saveBranchRulesAction(currentCenterId, currentRules);
    setSaving(false);
    if (!res.success) {
      toast.error(res.error || 'Failed to save rules');
      return;
    }
    if (res.rules && Array.isArray(res.rules)) {
      setRulesByBranch((prev) => ({ ...prev, [currentCenterId]: res.rules }));
    }
    toast.success(isAr ? 'تم حفظ أوقات العمل بنجاح' : 'Working hours saved successfully');
  };

  const handleInitWeek = async () => {
    if (!currentCenterId) return;
    setIniting(true);
    const res = await initWeekRulesAction(currentCenterId);
    setIniting(false);
    if (!res.success) {
      toast.error(res.error || 'Failed to initialize week');
      return;
    }
    if (res.rules && Array.isArray(res.rules)) {
      setRulesByBranch((prev) => ({ ...prev, [currentCenterId]: res.rules }));
    }
    toast.success(isAr ? 'تمت تهيئة ساعات الأسبوع الافتراضية بنجاح!' : 'Standard week initialized successfully!');
  };

  const handleAddSubmit = async (ruleData: Omit<DayRule, 'branchId' | 'slotDurationMinutes'>) => {
    if (!currentCenterId) return;
    const newRule: DayRule = { ...ruleData, branchId: currentCenterId, slotDurationMinutes: 15 };
    const existing = currentRules.filter((r) => r.dayOfWeek !== ruleData.dayOfWeek);
    const updated = [...existing, newRule].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
    setRulesByBranch((prev) => ({ ...prev, [currentCenterId]: updated }));
    setIsDialogOpen(false);
    setSaving(true);
    const res = await saveBranchRulesAction(currentCenterId, updated);
    setSaving(false);
    if (res.success) {
      if (res.rules && Array.isArray(res.rules)) {
        setRulesByBranch((prev) => ({ ...prev, [currentCenterId]: res.rules }));
      }
      toast.success(isAr ? 'تم حفظ أوقات العمل بنجاح' : 'Working hours saved successfully');
    } else {
      toast.error(res.error || 'Failed to persist rule');
    }
  };

  return (
    <div className="space-y-4">
      {/* Center selector and quick actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {centerList.map((c) => (
            <button
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                currentCenterId === c.id
                  ? 'bg-brand text-primary-foreground shadow-sm'
                  : 'border border-line-subtle bg-surface text-content-muted hover:text-content-strong'
              }`}
              key={c.id}
              onClick={() => setActiveBranchId(c.id)}
              type="button"
            >
              {isAr ? c.nameAr : c.nameEn}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button
            className="flex items-center gap-1.5 rounded-xl border border-line-subtle bg-surface text-xs font-bold text-content-strong hover:bg-surface-canvas"
            disabled={initing || !currentCenterId}
            onClick={handleInitWeek}
            type="button"
          >
            <Sparkles className="size-3.5 text-brand" />
            <span>{initing ? (isAr ? 'جاري التهيئة...' : 'Initializing...') : t.adminSettings.initWeek}</span>
          </Button>

          <Button
            className="flex items-center gap-1.5 rounded-xl bg-brand text-xs font-bold text-primary-foreground shadow-sm hover:opacity-95"
            disabled={!currentCenterId}
            onClick={() => setIsDialogOpen(true)}
            type="button"
          >
            <Plus className="size-3.5" />
            <span>{t.adminSettings.addHours}</span>
          </Button>
        </div>
      </div>

      {/* Rules Table or Empty State */}
      <div className="rounded-2xl border border-line-subtle bg-surface shadow-xs overflow-hidden">
        {currentRules.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="rounded-2xl bg-brand/10 p-4 text-brand">
              <Clock className="size-8" />
            </div>
            <h3 className="mt-3 text-sm font-bold text-content-strong">
              {t.adminSettings.noHoursConfigured}
            </h3>
            <p className="mt-1 max-w-md text-xs text-content-muted">
              {isAr
                ? 'لم يتم ضبط ساعات عمل لهذا المركز بعد. يمكنك تهيئة أسبوع قياسي تلقائياً بنقرة واحدة.'
                : 'No working hours set for this center yet. You can auto-generate a standard week with one click.'}
            </p>
            <div className="mt-5 flex items-center gap-3">
              <Button className="flex items-center gap-2 rounded-xl bg-brand text-xs font-bold text-primary-foreground shadow-sm" disabled={initing} onClick={handleInitWeek} type="button">
                <Sparkles className="size-4" />
                <span>{initing ? (isAr ? 'جاري التهيئة...' : 'Initializing...') : t.adminSettings.initWeek}</span>
              </Button>
              <Button className="rounded-xl border border-line-subtle bg-surface text-xs font-bold text-content-strong hover:bg-surface-canvas" onClick={() => setIsDialogOpen(true)} type="button">
                <Plus className="size-4" />
                <span>{t.adminSettings.addHours}</span>
              </Button>
            </div>
          </div>
        ) : (
          <>
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
                        <td className="p-3 font-bold text-content-strong whitespace-nowrap">{dayName}</td>
                        <td className="p-3 text-center">
                          <button
                            className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors ${
                              rule.isOpen ? 'bg-status-success-bg text-status-success' : 'bg-status-error-bg text-status-error'
                            }`}
                            onClick={() => updateRuleField(rule.dayOfWeek, 'isOpen', !rule.isOpen)}
                            type="button"
                          >
                            {rule.isOpen ? t.adminSettings.isOpen : t.adminSettings.closed}
                          </button>
                        </td>
                        <td className="p-3">
                          <input
                            aria-label={`${dayName} ${t.adminSettings.from}`}
                            className="rounded-lg border border-line-subtle bg-surface-canvas px-2 py-1 text-xs font-mono disabled:opacity-50"
                            disabled={!rule.isOpen}
                            onChange={(e) => updateRuleField(rule.dayOfWeek, 'startTime', e.target.value)}
                            type="time"
                            value={rule.startTime}
                          />
                        </td>
                        <td className="p-3">
                          <input
                            aria-label={`${dayName} ${t.adminSettings.to}`}
                            className="rounded-lg border border-line-subtle bg-surface-canvas px-2 py-1 text-xs font-mono disabled:opacity-50"
                            disabled={!rule.isOpen}
                            onChange={(e) => updateRuleField(rule.dayOfWeek, 'endTime', e.target.value)}
                            type="time"
                            value={rule.endTime}
                          />
                        </td>
                        <td className="p-3">
                          <input
                            aria-label={`${dayName} ${t.adminSettings.maxDaily}`}
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
                            aria-label={`${dayName} ${t.adminSettings.maxPerHour}`}
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
                            aria-label={`${dayName} ${t.adminSettings.maxPerSlot}`}
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
          </>
        )}
      </div>

      <BranchHoursAddDialog
        currentRules={currentRules}
        isAr={isAr}
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleAddSubmit}
        saving={saving}
        t={t}
      />
    </div>
  );
}

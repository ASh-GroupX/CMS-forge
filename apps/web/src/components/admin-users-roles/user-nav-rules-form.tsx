'use client';

import React, { useState, useRef } from 'react';
import { Button } from '../ui/button';
import { ActionDialog } from '../shared/action-dialog';
import type { Locale } from '../../i18n/staff-shell';
import type { AdminUser } from '../../lib/staff-admin-users-api';

const ALL_NAV_KEYS = [
  { key: 'dashboard', labelEn: 'Dashboard', labelAr: 'لوحة التحكم' },
  { key: 'internalTickets', labelEn: 'Internal Tickets', labelAr: 'التذاكر الداخلية' },
  { key: 'complaints', labelEn: 'Complaints', labelAr: 'الشكاوى والطلبات' },
  { key: 'customers', labelEn: 'Customers', labelAr: 'العملاء' },
  { key: 'tasks', labelEn: 'Tasks', labelAr: 'المهام' },
  { key: 'communication', labelEn: 'Communication', labelAr: 'المحادثات والتواصل' },
  { key: 'reports', labelEn: 'Reports', labelAr: 'التقارير' },
  { key: 'admin', labelEn: 'Admin Hub', labelAr: 'إدارة النظام' },
  { key: 'audit', labelEn: 'Audit Logs', labelAr: 'سجل العمليات' },
] as const;

const CRM_KEYS = ['dashboard', 'complaints', 'customers', 'tasks', 'communication', 'reports', 'admin', 'audit'];
const INTERNAL_KEYS = ['dashboard', 'internalTickets', 'tasks', 'admin', 'audit'];

type ViewMode = 'BOTH' | 'CRM' | 'INTERNAL_TICKETS' | 'CUSTOM';

export function UserNavRulesForm({
  action,
  locale,
  user,
}: {
  action: (formData: FormData) => void | Promise<void>;
  locale: Locale;
  user: AdminUser;
}) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const initialMode: ViewMode = (user.viewMode as ViewMode) || 'BOTH';
  const initialKeys = user.allowedNavKeys && user.allowedNavKeys.length > 0
    ? user.allowedNavKeys
    : initialMode === 'CRM'
      ? CRM_KEYS
      : initialMode === 'INTERNAL_TICKETS'
        ? INTERNAL_KEYS
        : ALL_NAV_KEYS.map((n) => n.key);

  const [viewMode, setViewMode] = useState<ViewMode>(initialMode);
  const [selectedKeys, setSelectedKeys] = useState<string[]>(initialKeys);

  const handleModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    if (mode === 'BOTH') {
      setSelectedKeys(ALL_NAV_KEYS.map((n) => n.key));
    } else if (mode === 'CRM') {
      setSelectedKeys(CRM_KEYS);
    } else if (mode === 'INTERNAL_TICKETS') {
      setSelectedKeys(INTERNAL_KEYS);
    }
  };

  const toggleKey = (key: string) => {
    setViewMode('CUSTOM');
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const isAr = locale === 'ar';

  return (
    <ActionDialog
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            {isAr ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button
            type="button"
            onClick={() => {
              setOpen(false);
              formRef.current?.requestSubmit();
            }}
          >
            {isAr ? 'حفظ الصلاحيات' : 'Save Rules'}
          </Button>
        </>
      }
      open={open}
      title={isAr ? `صلاحيات الصفحات: ${user.nameAr || user.nameEn}` : `Page Access: ${user.nameEn}`}
      trigger={
        <Button size="sm" variant="outline">
          {isAr ? 'الصفحات' : 'Nav Rules'}
        </Button>
      }
      onOpenChange={setOpen}
    >
      <form action={action} className="grid gap-4 py-3" ref={formRef}>
        <input name="id" type="hidden" value={user.id} />
        <input name="locale" type="hidden" value={locale} />
        <input name="viewMode" type="hidden" value={viewMode} />

        <div className="grid gap-2">
          <label className="text-sm font-semibold">
            {isAr ? 'وضع العرض المسبق' : 'Preset View Mode'}
          </label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              className={`rounded border p-2 text-start font-medium transition-colors ${
                viewMode === 'BOTH' ? 'border-brand bg-brand/10 text-brand' : 'border-line-subtle hover:bg-muted/40'
              }`}
              onClick={() => handleModeChange('BOTH')}
            >
              <span className="block font-bold">{isAr ? 'الكل (CRM + التذاكر)' : 'Both (Full Access)'}</span>
              <span className="text-[10px] text-muted-foreground">{isAr ? 'عرض كافة أقسام النظام' : 'All tabs enabled'}</span>
            </button>
            <button
              type="button"
              className={`rounded border p-2 text-start font-medium transition-colors ${
                viewMode === 'CRM' ? 'border-brand bg-brand/10 text-brand' : 'border-line-subtle hover:bg-muted/40'
              }`}
              onClick={() => handleModeChange('CRM')}
            >
              <span className="block font-bold">{isAr ? 'CRM فقط' : 'CRM Only'}</span>
              <span className="text-[10px] text-muted-foreground">{isAr ? 'بدون التذاكر الداخلية' : 'Excludes internal tickets'}</span>
            </button>
            <button
              type="button"
              className={`rounded border p-2 text-start font-medium transition-colors ${
                viewMode === 'INTERNAL_TICKETS' ? 'border-brand bg-brand/10 text-brand' : 'border-line-subtle hover:bg-muted/40'
              }`}
              onClick={() => handleModeChange('INTERNAL_TICKETS')}
            >
              <span className="block font-bold">{isAr ? 'التذاكر الداخلية فقط' : 'Internal Tickets Only'}</span>
              <span className="text-[10px] text-muted-foreground">{isAr ? 'حصر على التذاكر والمهام' : 'Only tickets & tasks'}</span>
            </button>
            <button
              type="button"
              className={`rounded border p-2 text-start font-medium transition-colors ${
                viewMode === 'CUSTOM' ? 'border-brand bg-brand/10 text-brand' : 'border-line-subtle hover:bg-muted/40'
              }`}
              onClick={() => setViewMode('CUSTOM')}
            >
              <span className="block font-bold">{isAr ? 'تخصيص مخصص' : 'Custom'}</span>
              <span className="text-[10px] text-muted-foreground">{isAr ? 'تحديد كل صفحة يدوياً' : 'Check/uncheck per tab'}</span>
            </button>
          </div>
        </div>

        <div className="grid gap-2 border-t pt-3">
          <label className="text-sm font-semibold">
            {isAr ? 'الصفحات المسموح برؤيتها في القائمة' : 'Allowed Sidebar Pages'}
          </label>
          <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
            {ALL_NAV_KEYS.map((item) => {
              const isChecked = selectedKeys.includes(item.key);
              return (
                <label
                  key={item.key}
                  className="flex items-center gap-2 rounded border border-line-subtle p-2 text-xs font-medium cursor-pointer hover:bg-muted/30"
                >
                  <input
                    checked={isChecked}
                    className="size-4 rounded border-line-subtle text-brand"
                    name="allowedNavKeys"
                    type="checkbox"
                    value={item.key}
                    onChange={() => toggleKey(item.key)}
                  />
                  <span>{isAr ? item.labelAr : item.labelEn}</span>
                </label>
              );
            })}
          </div>
        </div>
      </form>
    </ActionDialog>
  );
}

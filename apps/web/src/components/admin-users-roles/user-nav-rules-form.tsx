'use client';

import React, { useState, useRef } from 'react';
import { ChevronDown, ChevronRight, ShieldCheck } from 'lucide-react';
import { Button } from '../ui/button';
import { ActionDialog } from '../shared/action-dialog';
import type { Locale } from '../../i18n/staff-shell';
import type { AdminUser } from '../../lib/staff-admin-users-api';

const MAIN_NAV_KEYS = [
  { key: 'dashboard', labelEn: 'Dashboard', labelAr: 'لوحة التحكم' },
  { key: 'internalTickets', labelEn: 'Internal Tickets', labelAr: 'التذاكر الداخلية' },
  { key: 'serviceBooking', labelEn: 'Service Booking', labelAr: 'حجوزات الصيانة' },
  { key: 'complaints', labelEn: 'Complaints', labelAr: 'الشكاوى والطلبات' },
  { key: 'customers', labelEn: 'Customers', labelAr: 'العملاء' },
  { key: 'tasks', labelEn: 'Tasks', labelAr: 'المهام' },
  { key: 'communication', labelEn: 'Communication', labelAr: 'المحادثات والتواصل' },
  { key: 'reports', labelEn: 'Reports', labelAr: 'التقارير' },
  { key: 'audit', labelEn: 'Audit Logs', labelAr: 'سجل العمليات' },
] as const;

const ADMIN_WORKSPACES = [
  { key: 'admin:booking-settings', labelEn: 'Service Booking Settings', labelAr: 'إعدادات حجز الصيانة' },
  { key: 'admin:complaint-settings', labelEn: 'Complaint Settings', labelAr: 'إعدادات الشكاوى' },
  { key: 'admin:ticket-settings', labelEn: 'Ticket Settings', labelAr: 'إعدادات التذاكر' },
  { key: 'admin:internal-tickets', labelEn: 'Internal Tickets Admin', labelAr: 'إدارة التذاكر الداخلية' },
  { key: 'admin:users', labelEn: 'Users & Staff', labelAr: 'المستخدمين والموظفين' },
  { key: 'admin:roles', labelEn: 'Roles & Permissions', labelAr: 'الأدوار والصلاحيات' },
  { key: 'admin:branches', labelEn: 'Branches', labelAr: 'الفروع' },
  { key: 'admin:categories', labelEn: 'Complaint Categories', labelAr: 'تصنيفات الشكاوى' },
  { key: 'admin:sla', labelEn: 'SLA Policies', labelAr: 'سياسات مستوى الخدمة' },
  { key: 'admin:notification-templates', labelEn: 'Notification Templates', labelAr: 'قوالب الإشعارات' },
  { key: 'admin:standard-problems', labelEn: 'Standard Problems', labelAr: 'المشكلات الشائعة' },
  { key: 'admin:complaint-templates', labelEn: 'Complaint Templates', labelAr: 'قوالب ردود الشكاوى' },
] as const;

const CRM_KEYS = ['dashboard', 'complaints', 'customers', 'tasks', 'communication', 'reports', 'audit'];
const INTERNAL_KEYS = ['dashboard', 'internalTickets', 'tasks', 'audit'];

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
  const [adminExpanded, setAdminExpanded] = useState(true);
  const formRef = useRef<HTMLFormElement>(null);

  const initialMode: ViewMode = (user.viewMode as ViewMode) || 'BOTH';
  const initialKeys = user.allowedNavKeys && user.allowedNavKeys.length > 0
    ? user.allowedNavKeys
    : initialMode === 'CRM'
      ? [...CRM_KEYS, 'admin', ...ADMIN_WORKSPACES.map((w) => w.key)]
      : initialMode === 'INTERNAL_TICKETS'
        ? [...INTERNAL_KEYS, 'admin', ...ADMIN_WORKSPACES.map((w) => w.key)]
        : [...MAIN_NAV_KEYS.map((n) => n.key), 'admin', ...ADMIN_WORKSPACES.map((w) => w.key)];

  const [viewMode, setViewMode] = useState<ViewMode>(initialMode);
  const [selectedKeys, setSelectedKeys] = useState<string[]>(initialKeys);

  const handleModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    if (mode === 'BOTH') {
      setSelectedKeys([...MAIN_NAV_KEYS.map((n) => n.key), 'admin', ...ADMIN_WORKSPACES.map((w) => w.key)]);
    } else if (mode === 'CRM') {
      setSelectedKeys([...CRM_KEYS, 'admin', ...ADMIN_WORKSPACES.map((w) => w.key)]);
    } else if (mode === 'INTERNAL_TICKETS') {
      setSelectedKeys([...INTERNAL_KEYS, 'admin', ...ADMIN_WORKSPACES.map((w) => w.key)]);
    }
  };

  const toggleKey = (key: string) => {
    setViewMode('CUSTOM');
    setSelectedKeys((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      // If adding an admin workspace, ensure 'admin' is also present
      if (key.startsWith('admin:') && !next.includes('admin')) {
        next.push('admin');
      }
      return next;
    });
  };

  const toggleAllAdmin = (enable: boolean) => {
    setViewMode('CUSTOM');
    setSelectedKeys((prev) => {
      const nonAdmin = prev.filter((k) => k !== 'admin' && !k.startsWith('admin:'));
      if (enable) {
        return [...nonAdmin, 'admin', ...ADMIN_WORKSPACES.map((w) => w.key)];
      }
      return nonAdmin;
    });
  };

  const isAr = locale === 'ar';
  const hasAnyAdminSelected = selectedKeys.includes('admin') || selectedKeys.some((k) => k.startsWith('admin:'));

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
      title={isAr ? `صلاحيات الصفحات والأقسام: ${user.nameAr || user.nameEn}` : `Page & Admin Access: ${user.nameEn}`}
      trigger={
        <Button size="sm" variant="outline">
          {isAr ? 'الصفحات والإدارة' : 'Nav & Rules'}
        </Button>
      }
      onOpenChange={setOpen}
    >
      <form action={action} className="grid gap-4 py-3 max-h-[75vh] overflow-y-auto pr-1" ref={formRef}>
        <input name="id" type="hidden" value={user.id} />
        <input name="locale" type="hidden" value={locale} />
        <input name="viewMode" type="hidden" value={viewMode} />

        {/* Hidden inputs to guarantee all selected keys are submitted */}
        {selectedKeys.map((k) => (
          <input key={k} name="allowedNavKeys" type="hidden" value={k} />
        ))}

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
              <span className="text-[10px] text-muted-foreground">{isAr ? 'تحديد كل قسم وصفحة يدوياً' : 'Fine-grained control'}</span>
            </button>
          </div>
        </div>

        {/* Main Navigation Pages */}
        <div className="grid gap-2 border-t pt-3">
          <label className="text-sm font-semibold">
            {isAr ? 'الصفحات الرئيسية في الشريط الجانبي' : 'Main Sidebar Pages'}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {MAIN_NAV_KEYS.map((item) => {
              const isChecked = selectedKeys.includes(item.key);
              return (
                <label
                  key={item.key}
                  className="flex items-center gap-2 rounded border border-line-subtle p-2 text-xs font-medium cursor-pointer hover:bg-muted/30"
                >
                  <input
                    checked={isChecked}
                    className="size-4 rounded border-line-subtle text-brand"
                    type="checkbox"
                    onChange={() => toggleKey(item.key)}
                  />
                  <span>{isAr ? item.labelAr : item.labelEn}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Granular Admin Hub Workspaces */}
        <div className="grid gap-2 border-t pt-3">
          <div className="flex items-center justify-between">
            <button
              type="button"
              className="flex items-center gap-1.5 text-sm font-semibold text-content-strong hover:text-brand"
              onClick={() => setAdminExpanded(!adminExpanded)}
            >
              {adminExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
              <ShieldCheck className="size-4 text-brand" />
              <span>{isAr ? 'صلاحيات إدارة النظام (Admin Hub)' : 'Admin Hub Workspaces'}</span>
            </button>

            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                className="text-brand hover:underline font-medium"
                onClick={() => toggleAllAdmin(true)}
              >
                {isAr ? 'تحديد الكل' : 'Select All'}
              </button>
              <span className="text-muted-foreground">|</span>
              <button
                type="button"
                className="text-muted-foreground hover:underline"
                onClick={() => toggleAllAdmin(false)}
              >
                {isAr ? 'إلغاء الكل' : 'Deselect All'}
              </button>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground">
            {isAr
              ? 'يمكنك تحديد الأقسام المحددة التي يستطيع هذا المستخدم الوصول إليها داخل إدارة النظام.'
              : 'Choose the exact administrative sections this user is allowed to view and manage.'}
          </p>

          {adminExpanded && (
            <div className="grid grid-cols-2 gap-2 mt-1">
              {ADMIN_WORKSPACES.map((workspace) => {
                const isChecked = selectedKeys.includes(workspace.key);
                return (
                  <label
                    key={workspace.key}
                    className={`flex items-center gap-2 rounded border p-2 text-xs font-medium cursor-pointer transition-colors ${
                      isChecked ? 'border-brand/40 bg-brand/5' : 'border-line-subtle hover:bg-muted/30'
                    }`}
                  >
                    <input
                      checked={isChecked}
                      className="size-4 rounded border-line-subtle text-brand"
                      type="checkbox"
                      onChange={() => toggleKey(workspace.key)}
                    />
                    <span>{isAr ? workspace.labelAr : workspace.labelEn}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </form>
    </ActionDialog>
  );
}

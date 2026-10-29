'use client';

import React, { useState, useEffect } from 'react';
import {
  Ban, CalendarClock, CalendarPlus, CheckCircle2, Eye,
  Search, ShieldAlert, ShieldCheck, ToggleLeft, ToggleRight, User,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../../../components/ui/button';
import { getAllUsersBookingRulesAction, updateUserBookingRulesAction } from './user-rules-actions';
import type { Locale } from '../../../../i18n/staff-shell';

type UserRule = {
  canViewBookings: boolean;
  canCreateBookings: boolean;
  canRescheduleBookings: boolean;
  canChangeStatus: boolean;
  canCancelBookings: boolean;
  canManageSettings: boolean;
};

export function UserRulesTab({ locale }: { locale: Locale }) {
  const isAr = locale === 'ar';
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [rules, setRules] = useState<UserRule>({
    canViewBookings: true,
    canCreateBookings: true,
    canRescheduleBookings: true,
    canChangeStatus: true,
    canCancelBookings: true,
    canManageSettings: false,
  });

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await getAllUsersBookingRulesAction();
      setUsers(data);
      if (data.length > 0 && !selectedUserId) selectUser(data[0]);
    } catch {
      toast.error(isAr ? 'فشل تحميل المستخدمين' : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const selectUser = (u: any) => {
    setSelectedUserId(u.id);
    const existing = u.bookingRule;
    const isAdmin = u.role?.code === 'ADMIN';
    setRules({
      canViewBookings: existing?.canViewBookings ?? true,
      canCreateBookings: existing?.canCreateBookings ?? true,
      canRescheduleBookings: existing?.canRescheduleBookings ?? true,
      canChangeStatus: existing?.canChangeStatus ?? true,
      canCancelBookings: existing?.canCancelBookings ?? true,
      canManageSettings: existing?.canManageSettings ?? isAdmin,
    });
  };

  const handleSave = async () => {
    if (!selectedUserId) return;
    setSaving(true);
    const res = await updateUserBookingRulesAction(selectedUserId, rules);
    setSaving(false);

    if (!res.success) {
      toast.error(res.error || (isAr ? 'فشل حفظ الصلاحيات' : 'Failed to save rules'));
      return;
    }

    toast.success(isAr ? 'تم حفظ صلاحيات وقواعد المستخدم بنجاح' : 'User booking rules saved successfully');
    setUsers((prev) =>
      prev.map((u) => (u.id === selectedUserId ? { ...u, bookingRule: { ...u.bookingRule, ...rules } } : u))
    );
  };

  const selectedUser = users.find((u) => u.id === selectedUserId);
  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.nameEn?.toLowerCase().includes(q) ||
      u.nameAr?.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q) ||
      u.role?.nameEn?.toLowerCase().includes(q)
    );
  });

  const toggle = (key: keyof UserRule) => {
    setRules((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const PERMISSION_CONFIG: { key: keyof UserRule; icon: any; titleAr: string; titleEn: string; descAr: string; descEn: string }[] = [
    {
      key: 'canViewBookings',
      icon: Eye,
      titleAr: 'عرض جدول ومواعيد الحجز',
      titleEn: 'View Service Bookings & Calendar',
      descAr: 'الاطلاع على قائمة المواعيد وجدول حجز الصيانة والتقويم اليومي والأسبوعي.',
      descEn: 'Access and view appointments, timeline, and daily/weekly calendars.',
    },
    {
      key: 'canCreateBookings',
      icon: CalendarPlus,
      titleAr: 'حجز مواعيد جديدة',
      titleEn: 'Book New Appointments',
      descAr: 'إمكانية إنشاء وحجز موعد صيانة جديد للعميل واختيار مركز الخدمة والوقت.',
      descEn: 'Ability to create and book new appointments for customers with slot selection.',
    },
    {
      key: 'canRescheduleBookings',
      icon: CalendarClock,
      titleAr: 'إعادة جدولة وتغيير الموعد',
      titleEn: 'Reschedule Appointments',
      descAr: 'تغيير تاريخ ووقت الحجز أو نقل الموعد إلى مركز صيانة آخر.',
      descEn: 'Change appointment date, time slot, or transfer to another service center.',
    },
    {
      key: 'canChangeStatus',
      icon: CheckCircle2,
      titleAr: 'تغيير وتحديث حالة الموعد',
      titleEn: 'Change Appointment Status',
      descAr: 'تحديث حالة الموعد (تأكيد، بدء الصيانة، إكمال الموعد، عدم الحضور).',
      descEn: 'Update appointment status (Confirm, In Service, Completed, No Show).',
    },
    {
      key: 'canCancelBookings',
      icon: Ban,
      titleAr: 'إلغاء المواعيد',
      titleEn: 'Cancel Bookings',
      descAr: 'إلغاء المواعيد المحجوزة للعملاء عند الحاجة.',
      descEn: 'Cancel booked appointments when requested.',
    },
    {
      key: 'canManageSettings',
      icon: ShieldAlert,
      titleAr: 'إدارة إعدادات ومراكز الحجز',
      titleEn: 'Manage Booking Settings',
      descAr: 'تعديل مراكز الصيانة، ساعات وأيام العمل، موديلات السيارات، وصلاحيات المستخدمين.',
      descEn: 'Manage service centers, working hours, car models, maintenance types, and user rules.',
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Users List Sidebar */}
      <div className="lg:col-span-5 flex flex-col gap-3 rounded-2xl border border-line-subtle bg-surface p-4 shadow-xs">
        <div className="flex items-center justify-between pb-2 border-b border-line-subtle">
          <div>
            <h3 className="text-sm font-bold text-content-strong">{isAr ? 'الموظفون والمستخدمون' : 'Staff Members'}</h3>
            <p className="text-xs text-content-muted">{isAr ? 'اختر مستخدماً لضبط صلاحيات الحجز' : 'Select a user to configure booking rules'}</p>
          </div>
          <span className="rounded-lg bg-surface-canvas px-2.5 py-1 text-xs font-semibold text-content-muted">
            {users.length} {isAr ? 'مستخدم' : 'users'}
          </span>
        </div>

        <div className="relative">
          <Search className="absolute start-3 top-2.5 size-4 text-content-subtle" />
          <input
            className="w-full rounded-xl border border-line-subtle bg-surface-canvas ps-9 pe-3 py-2 text-xs focus:border-brand focus:outline-none"
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isAr ? 'بحث بالاسم أو اسم المستخدم...' : 'Search by name or username...'}
            value={search}
          />
        </div>

        <div className="flex flex-col gap-1.5 max-h-[30rem] overflow-y-auto pe-1">
          {filteredUsers.map((u) => {
            const isSelected = u.id === selectedUserId;
            const r = u.bookingRule;
            return (
              <button
                className={`flex items-center justify-between p-3 rounded-xl border text-start transition-all ${
                  isSelected ? 'border-brand bg-brand/5 shadow-2xs' : 'border-transparent hover:bg-surface-canvas/60'
                }`}
                key={u.id}
                onClick={() => selectUser(u)}
                type="button"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`size-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isSelected ? 'bg-brand text-primary-foreground' : 'bg-surface-canvas text-content-strong'}`}>
                    {(u.nameEn || u.username || 'U').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-content-strong truncate">{isAr ? u.nameAr || u.nameEn : u.nameEn || u.nameAr}</p>
                    <p className="text-[11px] text-content-muted truncate font-mono">@{u.username || u.email || 'user'}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="rounded-md bg-surface-canvas border border-line-subtle px-1.5 py-0.5 text-[10px] font-semibold text-content-muted">
                    {u.role?.nameEn || u.role?.code}
                  </span>
                  {r && !r.canCreateBookings && (
                    <span className="text-[10px] font-bold text-status-warning">{isAr ? 'عرض فقط' : 'View only'}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Rules Form Panel */}
      <div className="lg:col-span-7 flex flex-col gap-4 rounded-2xl border border-line-subtle bg-surface p-5 shadow-xs">
        {selectedUser ? (
          <>
            <div className="flex items-center justify-between pb-3 border-b border-line-subtle">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-2xl bg-brand/10 text-brand flex items-center justify-center font-bold">
                  <ShieldCheck className="size-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-content-strong">
                    {isAr ? selectedUser.nameAr || selectedUser.nameEn : selectedUser.nameEn || selectedUser.nameAr}
                  </h3>
                  <p className="text-xs text-content-muted">
                    {selectedUser.role?.nameEn} • @{selectedUser.username}
                  </p>
                </div>
              </div>

              <Button
                className="bg-brand text-primary-foreground text-xs font-bold rounded-xl"
                disabled={saving}
                onClick={handleSave}
                size="sm"
                type="button"
              >
                {saving ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'حفظ الصلاحيات' : 'Save Rules')}
              </Button>
            </div>

            <div className="grid gap-3">
              {PERMISSION_CONFIG.map(({ key, icon: Icon, titleAr, titleEn, descAr, descEn }) => {
                const enabled = rules[key];
                return (
                  <div
                    className={`flex items-start justify-between gap-3 p-3.5 rounded-xl border transition-all ${
                      enabled ? 'border-line-subtle bg-surface' : 'border-line-subtle/50 bg-surface-canvas/40 opacity-75'
                    }`}
                    key={key}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${enabled ? 'bg-brand/10 text-brand' : 'bg-surface-canvas text-content-muted'}`}>
                        <Icon className="size-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-content-strong">{isAr ? titleAr : titleEn}</h4>
                        <p className="text-[11px] text-content-muted mt-0.5">{isAr ? descAr : descEn}</p>
                      </div>
                    </div>

                    <button
                      className="shrink-0 p-1 text-content-muted hover:text-brand transition-colors"
                      onClick={() => toggle(key)}
                      type="button"
                    >
                      {enabled ? (
                        <ToggleRight className="size-6 text-status-success" />
                      ) : (
                        <ToggleLeft className="size-6 text-content-muted" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="py-20 text-center text-xs text-content-muted">
            {isAr ? 'اختر مستخدماً من القائمة الجانبية لتعديل صلاحياته' : 'Select a user from the sidebar to edit their rules'}
          </div>
        )}
      </div>
    </div>
  );
}

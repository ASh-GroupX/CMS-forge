'use client';

import React, { useState, useEffect } from 'react';
import { User, ShieldCheck, ToggleLeft, ToggleRight, Search, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { getAllUsersRules, updateUserTicketRules } from './actions';

export function UserRulesTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [rules, setRules] = useState({
    canSendWithoutManagerApproval: false,
    canDirectAssignOfficer: true,
    canSelfAssign: true,
    canTransferDepartment: true,
    canCloseDirectly: true,
    canReopenTickets: true,
  });

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await getAllUsersRules();
      setUsers(data);
      if (data.length > 0 && !selectedUserId) {
        selectUser(data[0]);
      }
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const selectUser = (u: any) => {
    setSelectedUserId(u.id);
    const existing = u.ticketRule;
    setRules({
      canSendWithoutManagerApproval: existing?.canSendWithoutManagerApproval ?? false,
      canDirectAssignOfficer: existing?.canDirectAssignOfficer ?? true,
      canSelfAssign: existing?.canSelfAssign ?? true,
      canTransferDepartment: existing?.canTransferDepartment ?? true,
      canCloseDirectly: existing?.canCloseDirectly ?? true,
      canReopenTickets: existing?.canReopenTickets ?? true,
    });
  };

  const handleSaveRules = async () => {
    if (!selectedUserId) return;
    setSaving(true);
    try {
      await updateUserTicketRules(selectedUserId, rules);
      toast.success('User ticket rules updated / تم حفظ صلاحيات وقواعد المستخدم');
      // Update local state
      setUsers((prev) =>
        prev.map((u) => (u.id === selectedUserId ? { ...u, ticketRule: { ...u.ticketRule, ...rules } } : u))
      );
    } catch {
      toast.error('Failed to update rules');
    } finally {
      setSaving(false);
    }
  };

  const selectedUser = users.find((u) => u.id === selectedUserId);

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.nameEn?.toLowerCase().includes(q) ||
      u.nameAr?.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q) ||
      u.department?.nameEn?.toLowerCase().includes(q)
    );
  });

  const toggle = (key: keyof typeof rules) => {
    setRules((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Users List Sidebar */}
      <div className="lg:col-span-5 flex flex-col gap-3 rounded-2xl border border-line-subtle bg-surface p-4 shadow-sm">
        <div className="flex items-center justify-between pb-2 border-b border-line-subtle">
          <div>
            <h3 className="text-sm font-bold text-content-strong">Staff Members / الموظفون</h3>
            <p className="text-xs text-content-muted">Select a user to configure individual ticket rules</p>
          </div>
          <span className="rounded-lg bg-surface-canvas px-2.5 py-1 text-xs font-semibold text-content-muted">
            {users.length} users
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 size-4 text-content-subtle" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, username, or department..."
            className="w-full rounded-xl border border-line-subtle bg-surface-canvas pl-9 pr-3 py-2 text-xs focus:border-brand focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1.5 max-h-[32rem] overflow-y-auto pr-1">
          {filteredUsers.map((u) => {
            const isSelected = u.id === selectedUserId;
            const hasApprovalBypass = u.ticketRule?.canSendWithoutManagerApproval;
            return (
              <button
                key={u.id}
                type="button"
                onClick={() => selectUser(u)}
                className={`flex items-center justify-between p-3 rounded-xl text-left transition-all ${
                  isSelected
                    ? 'border border-brand/50 bg-brand/5 text-content-strong shadow-sm'
                    : 'border border-transparent bg-surface hover:bg-surface-canvas/50 text-content-muted'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`rounded-lg p-2 ${isSelected ? 'bg-brand text-white' : 'bg-surface-raised text-content-muted'}`}>
                    <User className="size-4" />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-bold text-content-strong truncate">
                      {u.nameEn} {u.nameAr ? `(${u.nameAr})` : ''}
                    </div>
                    <div className="text-[11px] text-content-subtle truncate">
                      {u.department?.nameEn || 'No Department'} • {u.role?.nameEn || u.role?.code}
                    </div>
                  </div>
                </div>

                {hasApprovalBypass && (
                  <span className="rounded bg-status-success/10 px-1.5 py-0.5 text-[10px] font-bold text-status-success whitespace-nowrap">
                    Direct Send
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Rules Configuration Panel */}
      <div className="lg:col-span-7 flex flex-col gap-5 rounded-2xl border border-line-subtle bg-surface p-5 shadow-sm">
        {selectedUser ? (
          <>
            <div className="flex items-center justify-between pb-4 border-b border-line-subtle">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-content-strong">{selectedUser.nameEn}</h3>
                  <span className="text-xs text-content-muted">({selectedUser.nameAr})</span>
                </div>
                <p className="text-xs text-content-muted mt-0.5">
                  Dept: <span className="font-semibold">{selectedUser.department?.nameEn || 'Unassigned'}</span> • Role:{' '}
                  <span className="font-semibold">{selectedUser.role?.nameEn || selectedUser.role?.code}</span>
                </p>
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={handleSaveRules}
                className="flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-brand-hover disabled:opacity-50 transition-all"
              >
                <ShieldCheck className="size-4" />
                {saving ? 'Saving...' : 'Save User Rules / حفظ'}
              </button>
            </div>

            {/* KEY RULE: Send without manager approval */}
            <div
              onClick={() => toggle('canSendWithoutManagerApproval')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                rules.canSendWithoutManagerApproval
                  ? 'border-status-success bg-status-success/5 shadow-sm'
                  : 'border-line-subtle bg-surface-canvas/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-content-strong">Send Without Manager Approval</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      rules.canSendWithoutManagerApproval ? 'bg-status-success/20 text-status-success' : 'bg-surface-raised text-content-muted'
                    }`}>
                      {rules.canSendWithoutManagerApproval ? 'ACTIVE / مفعل' : 'OFF / معطل'}
                    </span>
                  </div>
                  <div className="text-xs text-content-muted font-arabic mt-0.5">
                    إرسال التذاكر مباشرة دون اشتراط موافقة المدير
                  </div>
                  <p className="text-xs text-content-subtle mt-2">
                    When enabled, tickets created by this user bypass the "Pending Approval" stage and are dispatched directly to the target department.
                  </p>
                </div>
                <button type="button" className="text-2xl ml-4">
                  {rules.canSendWithoutManagerApproval ? (
                    <ToggleRight className="size-8 text-status-success" />
                  ) : (
                    <ToggleLeft className="size-8 text-content-muted" />
                  )}
                </button>
              </div>
            </div>

            {/* Other Action Rules */}
            <div className="flex flex-col gap-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-content-subtle">
                Action & Workflow Permissions / صلاحيات الإجراءات
              </h4>

              {[
                {
                  key: 'canDirectAssignOfficer',
                  titleEn: 'Direct Officer Assignment',
                  titleAr: 'توجيه التذكرة لموظف محدد عند الإنشاء',
                  desc: 'Allows this user to pick a specific officer directly instead of only department queue.',
                },
                {
                  key: 'canSelfAssign',
                  titleEn: 'Self-Assignment from Team Inbox',
                  titleAr: 'استلام التذاكر غير المسندة ذاتياً',
                  desc: 'Allows this user to take ownership of unassigned tickets in their department.',
                },
                {
                  key: 'canTransferDepartment',
                  titleEn: 'Cross-Department Ticket Transfer',
                  titleAr: 'تحويل التذاكر بين الأقسام المختلفة',
                  desc: 'Allows this user to transfer tickets to other permitted departments.',
                },
                {
                  key: 'canCloseDirectly',
                  titleEn: 'Direct Ticket Resolution & Close',
                  titleAr: 'حل وإغلاق التذاكر المباشر',
                  desc: 'Permits this user to execute RESOLVE and CLOSE actions on their assigned tickets.',
                },
                {
                  key: 'canReopenTickets',
                  titleEn: 'Reopen Closed / Rejected Tickets',
                  titleAr: 'إعادة فتح التذاكر المغلقة أو المرفوضة',
                  desc: 'Allows this user to request reopening previously resolved or rejected tickets.',
                },
              ].map((item) => {
                const val = (rules as any)[item.key];
                return (
                  <div
                    key={item.key}
                    onClick={() => toggle(item.key as any)}
                    className="flex items-center justify-between p-3 rounded-xl border border-line-subtle bg-surface hover:bg-surface-canvas/40 cursor-pointer transition-all"
                  >
                    <div>
                      <div className="text-xs font-bold text-content-strong">{item.titleEn}</div>
                      <div className="text-[11px] text-content-muted font-arabic">{item.titleAr}</div>
                      <p className="text-[10px] text-content-subtle mt-0.5">{item.desc}</p>
                    </div>
                    <button type="button">
                      {val ? <ToggleRight className="size-6 text-brand" /> : <ToggleLeft className="size-6 text-content-muted" />}
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="flex h-64 items-center justify-center text-xs text-content-muted">
            Select a staff member from the list to view and configure their ticket rules.
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, ArrowDownLeft, ArrowUpRight, Loader2, Save, Search } from 'lucide-react';
import { getDepartmentRouting, updateDepartmentRouting } from './actions';
import { toast } from 'sonner';

type DepartmentOption = { id: string; nameEn: string; nameAr?: string; code?: string };

export function DepartmentRoutingForm({ departmentId, departmentName, allDepartments }: {
  departmentId: string; departmentName: string; allDepartments: DepartmentOption[];
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendMode, setSendMode] = useState<'ALL' | 'RESTRICTED'>('ALL');
  const [sendAllowedIds, setSendAllowedIds] = useState<string[]>([]);
  const [receiveMode, setReceiveMode] = useState<'ALL' | 'RESTRICTED'>('ALL');
  const [receiveAllowedIds, setReceiveAllowedIds] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getDepartmentRouting(departmentId)
      .then((data) => {
        if (!active) return;
        const sendIds: string[] = Array.isArray(data?.allowedSendToDepartmentIds) ? data.allowedSendToDepartmentIds : [];
        const recvIds: string[] = Array.isArray(data?.allowedReceiveFromDepartmentIds) ? data.allowedReceiveFromDepartmentIds : [];
        setSendAllowedIds(sendIds);
        setSendMode(sendIds.length > 0 ? 'RESTRICTED' : 'ALL');
        setReceiveAllowedIds(recvIds);
        setReceiveMode(recvIds.length > 0 ? 'RESTRICTED' : 'ALL');
      })
      .catch(() => { if (active) toast.error('Failed to load department routing rules'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [departmentId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDepartmentRouting(
        departmentId,
        sendMode === 'ALL' ? [] : sendAllowedIds,
        receiveMode === 'ALL' ? [] : receiveAllowedIds,
      );
      toast.success('Department routing rules updated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save routing rules');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-line-subtle bg-surface p-8 text-content-subtle">
        <Loader2 className="size-6 animate-spin text-brand" />
        <span className="ms-2 text-sm font-semibold">Loading routing rules...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-3 rounded-xl border border-line-subtle bg-surface p-4 shadow-sm">
        <div className="rounded-lg bg-brand/10 p-2 text-brand"><ArrowLeftRight className="size-5" /></div>
        <div className="flex-1 text-sm">
          <p className="font-bold text-content-strong">Routing Permissions for {departmentName}</p>
          <p className="mt-0.5 text-xs text-content-muted">
            Configure which departments this department is allowed to send tickets to (Outgoing), and which departments are allowed to send tickets here (Incoming). Setting to &quot;All&quot; leaves exchange unrestricted.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-brand-hover disabled:opacity-50"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save Rules
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <RoutingDirectionCard
          title="Outgoing: Who this department can send to"
          subtitle="المسموح لهذا القسم الإرسال إليهم"
          color="blue"
          icon={<ArrowUpRight className="size-5 text-blue-600 dark:text-blue-400" />}
          mode={sendMode}
          onModeChange={setSendMode}
          selectedIds={sendAllowedIds}
          onSelectionChange={setSendAllowedIds}
          allDepartments={allDepartments}
        />
        <RoutingDirectionCard
          title="Incoming: Who can send to this department"
          subtitle="المسموح لهم بالإرسال لهذا القسم"
          color="emerald"
          icon={<ArrowDownLeft className="size-5 text-emerald-600 dark:text-emerald-400" />}
          mode={receiveMode}
          onModeChange={setReceiveMode}
          selectedIds={receiveAllowedIds}
          onSelectionChange={setReceiveAllowedIds}
          allDepartments={allDepartments}
        />
      </div>
    </div>
  );
}

function RoutingDirectionCard({
  title, subtitle, color, icon, mode, onModeChange, selectedIds, onSelectionChange, allDepartments,
}: {
  title: string; subtitle: string; color: 'blue' | 'emerald'; icon: React.ReactNode;
  mode: 'ALL' | 'RESTRICTED'; onModeChange: (m: 'ALL' | 'RESTRICTED') => void;
  selectedIds: string[]; onSelectionChange: (ids: string[]) => void; allDepartments: DepartmentOption[];
}) {
  const [search, setSearch] = useState('');
  const activeBg = color === 'blue' ? 'bg-blue-600' : 'bg-emerald-600';
  const highlightClass = color === 'blue' ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300 font-bold' : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold';

  const toggle = (id: string) => {
    onSelectionChange(selectedIds.includes(id) ? selectedIds.filter((i) => i !== id) : [...selectedIds, id]);
  };

  const filtered = allDepartments.filter(
    (d) => d.nameEn.toLowerCase().includes(search.toLowerCase()) || (d.nameAr && d.nameAr.includes(search)) || (d.code && d.code.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div className="flex flex-col rounded-xl border border-line-subtle bg-surface p-5 shadow-sm">
      <div className="flex items-center gap-2 border-b border-line-subtle pb-3">
        {icon}
        <div><h3 className="text-sm font-bold text-content-strong">{title}</h3><p className="text-xs text-content-muted">{subtitle}</p></div>
      </div>
      <div className="mt-4 flex gap-2">
        <button type="button" onClick={() => onModeChange('ALL')} className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold transition-all ${mode === 'ALL' ? `${activeBg} text-white shadow-sm` : 'border border-line-subtle bg-surface-canvas text-content-muted hover:bg-surface'}`}>
          All Departments (Unrestricted)
        </button>
        <button type="button" onClick={() => onModeChange('RESTRICTED')} className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold transition-all ${mode === 'RESTRICTED' ? `${activeBg} text-white shadow-sm` : 'border border-line-subtle bg-surface-canvas text-content-muted hover:bg-surface'}`}>
          Specific Departments ({selectedIds.length})
        </button>
      </div>
      {mode === 'RESTRICTED' && (
        <div className="mt-4 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <div className="relative flex-1">
              <Search className="absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-content-muted" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search departments..." className="w-full rounded-lg border border-line-subtle bg-surface-canvas py-1.5 pe-3 ps-8 text-xs outline-none focus:border-brand" />
            </div>
            <div className="flex gap-1 text-xs">
              <button type="button" onClick={() => onSelectionChange(allDepartments.map((d) => d.id))} className="rounded px-2 py-1 font-semibold text-brand hover:bg-brand/10">All</button>
              <button type="button" onClick={() => onSelectionChange([])} className="rounded px-2 py-1 font-semibold text-content-muted hover:bg-surface-canvas">Clear</button>
            </div>
          </div>
          <div className="flex max-h-64 flex-col gap-1 overflow-y-auto rounded-lg border border-line-subtle bg-surface-canvas p-2">
            {filtered.map((dept) => {
              const checked = selectedIds.includes(dept.id);
              return (
                <label key={dept.id} className={`flex cursor-pointer items-center justify-between rounded-md p-2 text-xs transition-colors ${checked ? highlightClass : 'hover:bg-surface text-content-strong'}`}>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={checked} onChange={() => toggle(dept.id)} className="size-4 rounded border-line-subtle text-brand focus:ring-brand" />
                    <span>{dept.nameEn}</span>
                  </div>
                  {dept.nameAr && <span className="text-[11px] text-content-muted" dir="rtl">{dept.nameAr}</span>}
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

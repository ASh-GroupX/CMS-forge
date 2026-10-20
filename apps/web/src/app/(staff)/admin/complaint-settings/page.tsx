'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, X, Check, AlertCircle, Sparkles, UserCheck, Loader2, Tag } from 'lucide-react';
import {
  getRootCauses, createRootCause, updateRootCause, deleteRootCause,
  getSalesAdvisors, createSalesAdvisor, updateSalesAdvisor, deleteSalesAdvisor,
} from './actions';
import { toast, Toaster } from 'sonner';
import { complaintTypeLabel } from '../../../../i18n/domain-labels';

const COMPLAINT_TYPES = [
  'COMPLAINT', 'ACTION_REQUEST', 'CALL_BACK_REQUEST', 'SERVICE_VISIT_REQUEST',
  'FOLLOW_UP_REQUEST', 'INFORMATION_REQUEST', 'INQUIRY', 'SUGGESTION', 'FEEDBACK',
] as const;

export default function ComplaintSettingsPage() {
  const [activeTab, setActiveTab] = useState<'rootCauses' | 'salesAdvisors'>('rootCauses');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [complaintType, setComplaintType] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const data = activeTab === 'rootCauses' ? await getRootCauses() : await getSalesAdvisors();
      setItems(data);
    } catch {
      toast.error('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    setNameEn(''); setNameAr(''); setComplaintType('ALL'); setFilterType('ALL'); setEditingId(null); setFormError('');
  }, [activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!nameEn.trim() || !nameAr.trim()) {
      const msg = 'Both English and Arabic names are required / الاسمان بالإنجليزية والعربية مطلوبان';
      setFormError(msg);
      return toast.error(msg);
    }

    setSubmitting(true);
    try {
      let res: { success: boolean; error?: string };
      if (activeTab === 'rootCauses') {
        const typePayload = complaintType === 'ALL' ? null : complaintType;
        res = editingId ? await updateRootCause(editingId, nameEn, nameAr, typePayload) : await createRootCause(nameEn, nameAr, typePayload);
        if (res.success) toast.success(editingId ? 'Root cause updated' : 'Root cause created');
      } else {
        res = editingId ? await updateSalesAdvisor(editingId, nameEn, nameAr) : await createSalesAdvisor(nameEn, nameAr);
        if (res.success) toast.success(editingId ? 'Sales advisor updated' : 'Sales advisor created');
      }

      if (!res.success) {
        setFormError(res.error || 'Operation failed');
        toast.error(res.error || 'Operation failed');
        return;
      }
      setNameEn(''); setNameAr(''); setComplaintType('ALL'); setEditingId(null);
      await fetchItems();
    } catch (err: any) {
      const msg = err?.message || 'Operation failed';
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      if (activeTab === 'rootCauses') await deleteRootCause(id);
      else await deleteSalesAdvisor(id);
      toast.success('Deleted successfully');
      fetchItems();
    } catch {
      toast.error('Deletion failed');
    }
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id); setNameEn(item.nameEn); setNameAr(item.nameAr); setComplaintType(item.complaintType || 'ALL');
  };

  const cancelEdit = () => {
    setEditingId(null); setNameEn(''); setNameAr(''); setComplaintType('ALL');
  };

  const displayedItems = items.filter((item) => {
    if (activeTab !== 'rootCauses' || filterType === 'ALL') return true;
    return (item.complaintType ?? 'ALL') === filterType;
  });

  return (
    <div className="mx-auto max-w-4xl p-6">
      <Toaster position="bottom-center" richColors />
      <div className="flex items-center gap-3 mb-2">
        <span className="flex size-9 items-center justify-center rounded-lg bg-brand/10 text-brand"><Sparkles className="size-5" /></span>
        <h1 className="text-2xl font-bold text-content-strong">Complaint Settings / إعدادات الشكاوى</h1>
      </div>
      <p className="mb-6 text-sm text-content-muted">Manage dropdown options for Root Causes and Sales Advisors per Request Type.</p>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b border-line-subtle pb-2">
        {[
          { id: 'rootCauses', icon: AlertCircle, label: 'فئات السبب الجذري / Root Causes' },
          { id: 'salesAdvisors', icon: UserCheck, label: 'مستشارو المبيعات / Sales Advisors' },
        ].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-brand text-brand-foreground shadow-sm font-semibold' : 'text-content-muted hover:bg-surface-raised hover:text-content-strong'}`}>
            <tab.icon className="size-4" /><span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Add / Edit Form */}
      <div className="mb-8 rounded-lg border border-line-subtle bg-surface p-5 shadow-sm">
        <h3 className="mb-4 text-base font-semibold text-content-emphasis">
          {editingId ? (activeTab === 'rootCauses' ? 'Edit Root Cause' : 'Edit Sales Advisor') : (activeTab === 'rootCauses' ? 'Add Root Cause' : 'Add Sales Advisor')}
        </h3>
        {formError && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-status-error/10 border border-status-error/20 p-3 text-sm text-status-error">
            <AlertCircle className="size-4 shrink-0" /><span>{formError}</span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          {activeTab === 'rootCauses' && (
            <div className="sm:col-span-2">
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-content-muted"><Tag className="size-3.5" />Request Type / نوع الطلب</label>
              <select value={complaintType} onChange={(e) => setComplaintType(e.target.value)} className="w-full rounded-md border border-line-subtle bg-surface px-3 py-2 text-sm focus:border-brand focus:outline-none">
                <option value="ALL">All Request Types / جميع أنواع الطلبات (عام)</option>
                {COMPLAINT_TYPES.map((t) => (
                  <option key={t} value={t}>{complaintTypeLabel('en', t)} — {complaintTypeLabel('ar', t)}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-content-muted">English Name *</label>
            <input type="text" value={nameEn} onChange={(e) => setNameEn(e.target.value)} placeholder="e.g. Workshop Delay" className="w-full rounded-md border border-line-subtle bg-surface px-3 py-2 text-sm focus:border-brand focus:outline-none" required />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-content-muted text-right">الاسم بالعربية *</label>
            <input type="text" dir="rtl" value={nameAr} onChange={(e) => setNameAr(e.target.value)} placeholder="مثال: تأخير الورشة" className="w-full rounded-md border border-line-subtle bg-surface px-3 py-2 text-sm text-right focus:border-brand focus:outline-none" required />
          </div>
          <div className="flex items-center gap-2 sm:col-span-2 pt-2">
            <button type="submit" disabled={submitting} className="flex items-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground shadow hover:bg-brand/90 transition-colors disabled:opacity-50">
              {submitting ? <Loader2 className="size-4 animate-spin" /> : editingId ? <Check className="size-4" /> : <Plus className="size-4" />}
              {submitting ? 'Saving...' : editingId ? 'Update' : 'Add'}
            </button>
            {editingId && (
              <button type="button" onClick={cancelEdit} className="flex items-center gap-1 rounded-md border border-line-subtle px-3 py-2 text-sm text-content-muted hover:bg-surface-raised">
                <X className="size-4" /> Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* List */}
      <div className="rounded-lg border border-line-subtle bg-surface shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line-subtle bg-surface-raised/50 px-4 py-3">
          <h2 className="text-sm font-semibold text-content-emphasis">
            {activeTab === 'rootCauses' ? 'Active Root Causes' : 'Active Sales Advisors'} ({displayedItems.length})
          </h2>
          {activeTab === 'rootCauses' && (
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="rounded-md border border-line-subtle bg-surface px-2.5 py-1 text-xs text-content-strong focus:outline-none">
              <option value="ALL">Filter: All Request Types</option>
              {COMPLAINT_TYPES.map((t) => (
                <option key={t} value={t}>{complaintTypeLabel('en', t)} / {complaintTypeLabel('ar', t)}</option>
              ))}
            </select>
          )}
        </div>
        {loading ? (
          <div className="p-8 text-center text-sm text-content-muted">Loading options...</div>
        ) : displayedItems.length === 0 ? (
          <div className="p-8 text-center text-sm text-content-muted">No items match the selection.</div>
        ) : (
          <div className="divide-y divide-line-subtle">
            {displayedItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 hover:bg-surface-raised/40 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-content-strong">{item.nameEn}</span>
                    {activeTab === 'rootCauses' && (
                      <span className="rounded bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground border">
                        {item.complaintType ? `${complaintTypeLabel('en', item.complaintType)} / ${complaintTypeLabel('ar', item.complaintType)}` : 'All Request Types / عام'}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-content-muted" dir="rtl">{item.nameAr}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleEdit(item)} className="p-1.5 text-content-muted hover:text-brand rounded hover:bg-surface-raised transition-colors" title="Edit"><Edit2 className="size-4" /></button>
                  <button onClick={() => handleDelete(item.id)} className="p-1.5 text-content-muted hover:text-red-600 rounded hover:bg-surface-raised transition-colors" title="Delete"><Trash2 className="size-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

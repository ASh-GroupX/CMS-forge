'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, X, Check, AlertCircle, Sparkles, UserCheck } from 'lucide-react';
import {
  getRootCauses,
  createRootCause,
  updateRootCause,
  deleteRootCause,
  getSalesAdvisors,
  createSalesAdvisor,
  updateSalesAdvisor,
  deleteSalesAdvisor,
} from './actions';
import { toast } from 'sonner';

export default function ComplaintSettingsPage() {
  const [activeTab, setActiveTab] = useState<'rootCauses' | 'salesAdvisors'>('rootCauses');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      if (activeTab === 'rootCauses') {
        const data = await getRootCauses();
        setItems(data);
      } else {
        const data = await getSalesAdvisors();
        setItems(data);
      }
    } catch {
      toast.error('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    setNameEn('');
    setNameAr('');
    setEditingId(null);
  }, [activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEn.trim() || !nameAr.trim()) {
      return toast.error('Both English and Arabic names are required');
    }

    try {
      if (activeTab === 'rootCauses') {
        if (editingId) {
          await updateRootCause(editingId, nameEn, nameAr);
          toast.success('Root cause updated successfully');
        } else {
          await createRootCause(nameEn, nameAr);
          toast.success('Root cause created successfully');
        }
      } else {
        if (editingId) {
          await updateSalesAdvisor(editingId, nameEn, nameAr);
          toast.success('Sales advisor updated successfully');
        } else {
          await createSalesAdvisor(nameEn, nameAr);
          toast.success('Sales advisor created successfully');
        }
      }
      setNameEn('');
      setNameAr('');
      setEditingId(null);
      fetchItems();
    } catch {
      toast.error('Operation failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      if (activeTab === 'rootCauses') {
        await deleteRootCause(id);
      } else {
        await deleteSalesAdvisor(id);
      }
      toast.success('Deleted successfully');
      fetchItems();
    } catch {
      toast.error('Deletion failed');
    }
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setNameEn(item.nameEn);
    setNameAr(item.nameAr);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNameEn('');
    setNameAr('');
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="flex items-center gap-3 mb-2">
        <span className="flex size-9 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary">
          <Sparkles className="size-5" />
        </span>
        <h1 className="text-2xl font-bold text-content-strong">Complaint Settings / إعدادات الشكاوى</h1>
      </div>
      <p className="mb-6 text-sm text-content-muted">
        Manage standard dropdown options for Root Cause Categories and Sales Advisors. These options populate the CRM fields in Complaint intake and workflow modals.
      </p>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b border-line-subtle pb-2">
        <button
          onClick={() => setActiveTab('rootCauses')}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'rootCauses'
              ? 'bg-brand-primary text-white shadow-sm'
              : 'text-content-muted hover:bg-surface-raised hover:text-content-strong'
          }`}
        >
          <AlertCircle className="size-4" />
          <span>فئات السبب الجذري / Root Cause Categories</span>
        </button>
        <button
          onClick={() => setActiveTab('salesAdvisors')}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'salesAdvisors'
              ? 'bg-brand-primary text-white shadow-sm'
              : 'text-content-muted hover:bg-surface-raised hover:text-content-strong'
          }`}
        >
          <UserCheck className="size-4" />
          <span>مستشارو المبيعات / Sales Advisors</span>
        </button>
      </div>

      {/* Add / Edit Form */}
      <div className="mb-8 rounded-lg border border-line-subtle bg-surface p-5 shadow-sm">
        <h3 className="mb-4 text-base font-semibold text-content-emphasis">
          {editingId
            ? activeTab === 'rootCauses'
              ? 'Edit Root Cause / تعديل فئة السبب الجذري'
              : 'Edit Sales Advisor / تعديل مستشار المبيعات'
            : activeTab === 'rootCauses'
              ? 'Add New Root Cause / إضافة فئة سبب جذري'
              : 'Add New Sales Advisor / إضافة مستشار مبيعات'}
        </h3>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-content-muted">English Name *</label>
            <input
              type="text"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder={activeTab === 'rootCauses' ? 'e.g. Workshop Delay' : 'e.g. Ahmed Al-Mutairi'}
              className="w-full rounded-md border border-line-subtle bg-surface px-3 py-2 text-sm focus:border-brand-primary focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-content-muted text-right">الاسم بالعربية *</label>
            <input
              type="text"
              dir="rtl"
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
              placeholder={activeTab === 'rootCauses' ? 'مثال: تأخير الورشة' : 'مثال: أحمد المطيري'}
              className="w-full rounded-md border border-line-subtle bg-surface px-3 py-2 text-sm text-right focus:border-brand-primary focus:outline-none"
              required
            />
          </div>
          <div className="flex items-center gap-2 sm:col-span-2 pt-2">
            <button
              type="submit"
              className="flex items-center gap-2 rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-white shadow hover:bg-brand-primary/90 transition-colors"
            >
              {editingId ? <Check className="size-4" /> : <Plus className="size-4" />}
              {editingId ? 'Update' : 'Add'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="flex items-center gap-1 rounded-md border border-line-subtle px-3 py-2 text-sm text-content-muted hover:bg-surface-raised"
              >
                <X className="size-4" /> Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* List */}
      <div className="rounded-lg border border-line-subtle bg-surface shadow-sm overflow-hidden">
        <div className="border-b border-line-subtle bg-surface-raised/50 px-4 py-3">
          <h2 className="text-sm font-semibold text-content-emphasis">
            {activeTab === 'rootCauses' ? 'Active Root Causes' : 'Active Sales Advisors'} ({items.length})
          </h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-sm text-content-muted">Loading options...</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-sm text-content-muted">No items defined yet. Add your first one above!</div>
        ) : (
          <div className="divide-y divide-line-subtle">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 hover:bg-surface-raised/40 transition-colors">
                <div className="flex-1">
                  <div className="font-medium text-sm text-content-strong">{item.nameEn}</div>
                  <div className="text-xs text-content-muted" dir="rtl">{item.nameAr}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-1.5 text-content-muted hover:text-brand-primary rounded hover:bg-surface-raised transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="size-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 text-content-muted hover:text-red-600 rounded hover:bg-surface-raised transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

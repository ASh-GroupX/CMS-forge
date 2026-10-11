'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, X, Check } from 'lucide-react';
import { getReasons, getDepartments, createReason, updateReason, deleteReason } from './actions';
import { toast } from 'sonner';

export default function TicketSettingsPage() {
  const [activeTab, setActiveTab] = useState<'waiting' | 'resolution' | 'reject'>('waiting');
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [reasonEn, setReasonEn] = useState('');
  const [reasonAr, setReasonAr] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Load departments on mount
  useEffect(() => {
    getDepartments().then(deps => {
      setDepartments(deps);
      if (deps.length > 0) setSelectedDepartmentId(deps[0].id);
    });
  }, []);

  const fetchItems = async () => {
    if (!selectedDepartmentId) return;
    setLoading(true);
    try {
      const data = await getReasons(activeTab, selectedDepartmentId);
      setItems(data);
    } catch (err) {
      toast.error('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDepartmentId) {
      fetchItems();
    }
    setReasonEn('');
    setReasonAr('');
    setEditingId(null);
  }, [activeTab, selectedDepartmentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reasonEn || !reasonAr) return toast.error('Both English and Arabic reasons are required');
    if (!selectedDepartmentId) return toast.error('Select a department first');
    
    try {
      if (editingId) {
        await updateReason(activeTab, editingId, reasonEn, reasonAr);
        toast.success('Updated successfully');
      } else {
        await createReason(activeTab, selectedDepartmentId, reasonEn, reasonAr);
        toast.success('Created successfully');
      }
      setReasonEn('');
      setReasonAr('');
      setEditingId(null);
      fetchItems();
    } catch (err) {
      toast.error('Operation failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this?')) return;
    try {
      await deleteReason(activeTab, id);
      toast.success('Deleted successfully');
      fetchItems();
    } catch (err) {
      toast.error('Deletion failed');
    }
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setReasonEn(item.reasonEn);
    setReasonAr(item.reasonAr);
  };

  const tabLabels = {
    waiting: 'Waiting Reasons',
    resolution: 'Resolution Subjects',
    reject: 'Reject Reasons',
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-2 text-2xl font-bold text-content-strong">Ticket Settings</h1>
      <p className="mb-6 text-sm text-content-muted">Manage standard reasons for each department. These appear as dropdown options when staff resolve, wait, or reject tickets.</p>

      {/* Department Selector */}
      <div className="mb-6">
        <label className="mb-1.5 block text-sm font-semibold text-content-strong">Select a department</label>
        <select
          className="w-full max-w-sm rounded-lg border border-line-subtle bg-surface-canvas px-3 py-2 text-sm outline-none focus:border-brand"
          value={selectedDepartmentId}
          onChange={(e) => setSelectedDepartmentId(e.target.value)}
        >
          <option value="">Select a department...</option>
          {departments.map((dept: any) => (
            <option key={dept.id} value={dept.id}>{dept.nameEn}</option>
          ))}
        </select>
      </div>

      {selectedDepartmentId && (
        <>
          {/* Tabs */}
          <div className="mb-6 flex gap-1 rounded-lg bg-surface-canvas p-1 border border-line-subtle">
            {(Object.keys(tabLabels) as Array<keyof typeof tabLabels>).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold transition-all ${
                  activeTab === tab 
                    ? 'bg-brand text-white shadow-sm' 
                    : 'text-content-subtle hover:text-content-strong hover:bg-surface'
                }`}
              >
                {tabLabels[tab]}
              </button>
            ))}
          </div>

          {/* Add / Edit Form */}
          <div className="mb-6 rounded-xl bg-surface p-5 shadow-sm border border-line-subtle">
            <h2 className="mb-3 text-base font-bold text-content-strong">
              {editingId ? `Edit ${tabLabels[activeTab].slice(0, -1)}` : `Add New ${tabLabels[activeTab].slice(0, -1)}`}
            </h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 md:flex-row md:items-end">
              <div className="flex-1">
                <label className="mb-1 block text-xs font-semibold text-content-subtle uppercase tracking-wide">English</label>
                <input 
                  type="text" 
                  className="w-full rounded-lg border border-line-subtle bg-surface-canvas px-3 py-2 text-sm outline-none focus:border-brand"
                  placeholder="e.g. Waiting for Customer Feedback"
                  value={reasonEn}
                  onChange={(e) => setReasonEn(e.target.value)}
                  required
                />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-xs font-semibold text-content-subtle uppercase tracking-wide">Arabic</label>
                <input 
                  type="text" 
                  className="w-full rounded-lg border border-line-subtle bg-surface-canvas px-3 py-2 text-sm outline-none focus:border-brand"
                  placeholder="مثال: في انتظار ملاحظات العميل"
                  dir="rtl"
                  value={reasonAr}
                  onChange={(e) => setReasonAr(e.target.value)}
                  required
                />
              </div>
              <div className="flex gap-2 shrink-0">
                {editingId && (
                  <button 
                    type="button"
                    onClick={() => { setEditingId(null); setReasonEn(''); setReasonAr(''); }}
                    className="rounded-lg border border-line-subtle px-3 py-2 text-sm font-semibold hover:bg-surface-canvas"
                  >
                    <X className="size-4" />
                  </button>
                )}
                <button 
                  type="submit" 
                  className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white hover:bg-brand-hover transition-colors"
                >
                  {editingId ? <><Check className="size-4" /> Save</> : <><Plus className="size-4" /> Add</>}
                </button>
              </div>
            </form>
          </div>

          {/* Table */}
          <div className="rounded-xl bg-surface shadow-sm border border-line-subtle overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-content-subtle">Loading...</div>
            ) : items.length === 0 ? (
              <div className="p-8 text-center text-content-subtle">
                No {tabLabels[activeTab].toLowerCase()} configured for this department yet.
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-canvas text-content-subtle border-b border-line-subtle">
                  <tr>
                    <th className="px-4 py-3 font-semibold">English</th>
                    <th className="px-4 py-3 font-semibold text-right">Arabic</th>
                    <th className="px-4 py-3 text-right w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-subtle">
                  {items.map((item: any) => (
                    <tr key={item.id} className="hover:bg-surface-canvas/50 transition-colors">
                      <td className="px-4 py-3 font-medium">{item.reasonEn}</td>
                      <td className="px-4 py-3 text-right" dir="rtl">{item.reasonAr}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => handleEdit(item)} className="p-1.5 rounded-md text-content-subtle hover:text-brand hover:bg-brand/10 transition-colors">
                          <Edit2 className="size-4" />
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-md text-content-subtle hover:text-red-500 hover:bg-red-500/10 ml-1 transition-colors">
                          <Trash2 className="size-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}

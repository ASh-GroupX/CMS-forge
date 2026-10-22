'use client';

import React, { useState, useEffect } from 'react';
import { Layers, ShieldCheck, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getDepartments } from './actions';
import { DepartmentFieldsTab } from './department-fields-tab';
import { UserRulesTab } from './user-rules-tab';
import { toast } from 'sonner';

export default function InternalTicketsAdminPage() {
  const [activeTab, setActiveTab] = useState<'fields' | 'rules'>('fields');
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDepartments()
      .then((deps) => {
        setDepartments(deps);
        if (deps.length > 0) setSelectedDepartmentId(deps[0].id);
      })
      .catch(() => toast.error('Failed to load departments'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-line-subtle pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/admin"
              className="flex items-center gap-1 text-xs font-semibold text-content-muted hover:text-brand transition-colors"
            >
              <ArrowLeft className="size-3.5" /> Back to Admin Hub / العودة لمركز الإدارة
            </Link>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-content-strong">
            Internal Ticket Rules & Fields / قواعد وحقول التذاكر الداخلية
          </h1>
          <p className="text-xs sm:text-sm text-content-muted mt-0.5">
            Customize form fields per department, and configure approval & action rules per staff user.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 rounded-xl bg-surface-canvas p-1 border border-line-subtle">
          <button
            type="button"
            onClick={() => setActiveTab('fields')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
              activeTab === 'fields'
                ? 'bg-brand text-white shadow-sm'
                : 'text-content-muted hover:text-content-strong'
            }`}
          >
            <Layers className="size-4" />
            Department Form Fields
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
              activeTab === 'rules'
                ? 'bg-brand text-white shadow-sm'
                : 'text-content-muted hover:text-content-strong'
            }`}
          >
            <ShieldCheck className="size-4" />
            User Action & Approval Rules
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex h-64 items-center justify-center text-xs text-content-muted">
          Loading ticket settings / جارٍ التحميل...
        </div>
      ) : activeTab === 'fields' ? (
        <DepartmentFieldsTab
          departments={departments}
          selectedDepartmentId={selectedDepartmentId}
          onSelectDepartment={setSelectedDepartmentId}
        />
      ) : (
        <UserRulesTab />
      )}
    </div>
  );
}

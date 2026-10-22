'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ToggleLeft, ToggleRight, FileText } from 'lucide-react';
import { toast } from 'sonner';
import {
  getDepartmentFields,
  updateDepartmentConfig,
  deleteDepartmentCustomField,
  updateDepartmentCustomField,
} from './actions';
import { AddCustomFieldForm } from './add-custom-field-form';

export function DepartmentFieldsTab({
  departments,
  selectedDepartmentId,
  onSelectDepartment,
}: {
  departments: Array<{ id: string; nameEn: string; nameAr?: string | null }>;
  selectedDepartmentId: string;
  onSelectDepartment: (id: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    enablePriorityField: true,
    enableDueDateField: true,
    enableAttachmentsField: true,
    enableOfficerSelection: true,
  });
  const [customFields, setCustomFields] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  const loadData = async () => {
    if (!selectedDepartmentId) return;
    setLoading(true);
    try {
      const data = await getDepartmentFields(selectedDepartmentId);
      setConfig(
        data.config || {
          enablePriorityField: true,
          enableDueDateField: true,
          enableAttachmentsField: true,
          enableOfficerSelection: true,
        }
      );
      setCustomFields(data.customFields || []);
    } catch {
      toast.error('Failed to load department fields');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    setIsAdding(false);
  }, [selectedDepartmentId]);

  const handleToggleConfig = async (key: keyof typeof config) => {
    const updated = { ...config, [key]: !config[key] };
    setConfig(updated);
    try {
      await updateDepartmentConfig(selectedDepartmentId, updated);
      toast.success('Field setting updated / تم تحديث إعداد الحقل');
    } catch {
      toast.error('Failed to update setting');
      setConfig(config);
    }
  };

  const handleDeleteField = async (fieldId: string) => {
    if (!confirm('Are you sure you want to delete this field? / هل أنت متأكد من حذف هذا الحقل؟')) return;
    try {
      await deleteDepartmentCustomField(selectedDepartmentId, fieldId);
      toast.success('Field deleted / تم حذف الحقل');
      loadData();
    } catch {
      toast.error('Failed to delete field');
    }
  };

  const handleToggleActive = async (field: any) => {
    try {
      await updateDepartmentCustomField(selectedDepartmentId, field.id, { isActive: !field.isActive });
      loadData();
    } catch {
      toast.error('Failed to toggle active state');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Department Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-line-subtle bg-surface-canvas/50 p-4">
        <div>
          <h3 className="text-sm font-bold text-content-strong">Target Department / القسم المعني</h3>
          <p className="text-xs text-content-muted">Choose the department whose internal ticket form fields you want to configure.</p>
        </div>
        <select
          value={selectedDepartmentId}
          onChange={(e) => onSelectDepartment(e.target.value)}
          className="rounded-xl border border-line-subtle bg-surface p-2.5 text-sm font-medium focus:border-brand focus:outline-none"
        >
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nameEn} {d.nameAr ? `(${d.nameAr})` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Standard Fields Config */}
      <div className="rounded-2xl border border-line-subtle bg-surface p-5 shadow-sm">
        <h3 className="text-sm font-bold text-content-strong mb-1">Standard Form Fields / الحقول الأساسية</h3>
        <p className="text-xs text-content-muted mb-4">Toggle which standard fields are visible when tickets are sent to this department.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { key: 'enablePriorityField', labelEn: 'Emergency Level (Priority)', labelAr: 'مستوى الأولوية والطارئ' },
            { key: 'enableDueDateField', labelEn: 'Timeline / Due Date Picker', labelAr: 'تاريخ الاستحقاق والمدة' },
            { key: 'enableAttachmentsField', labelEn: 'File Attachments (JPG)', labelAr: 'مرفقات الملفات والصور' },
            { key: 'enableOfficerSelection', labelEn: 'Specific Officer Selection', labelAr: 'إمكانية توجيه التذكرة لموظف محدد' },
          ].map((item) => {
            const enabled = (config as any)[item.key];
            return (
              <div
                key={item.key}
                onClick={() => handleToggleConfig(item.key as any)}
                className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                  enabled ? 'border-brand/40 bg-brand/5' : 'border-line-subtle bg-surface-canvas/40 opacity-70'
                }`}
              >
                <div>
                  <div className="text-sm font-semibold text-content-strong">{item.labelEn}</div>
                  <div className="text-xs text-content-muted font-arabic">{item.labelAr}</div>
                </div>
                <button type="button" className={`text-xl ${enabled ? 'text-brand' : 'text-content-muted'}`}>
                  {enabled ? <ToggleRight className="size-6 text-brand" /> : <ToggleLeft className="size-6" />}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom Fields Section */}
      <div className="rounded-2xl border border-line-subtle bg-surface p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-content-strong">Department Custom Fields / الحقول المخصصة للقسم</h3>
            <p className="text-xs text-content-muted">Fields created here will automatically appear on the creation form when this department is selected.</p>
          </div>
          <button
            type="button"
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1.5 rounded-xl bg-brand px-3.5 py-2 text-xs font-bold text-white hover:bg-brand-hover shadow-sm transition-all"
          >
            <Plus className="size-4" /> Add Custom Field
          </button>
        </div>

        {isAdding && (
          <AddCustomFieldForm
            departmentId={selectedDepartmentId}
            onSuccess={() => {
              setIsAdding(false);
              loadData();
            }}
            onCancel={() => setIsAdding(false)}
          />
        )}

        {/* Custom Fields List */}
        {customFields.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line-subtle p-6 text-center text-xs text-content-muted">
            No custom fields configured for this department yet. Click "+ Add Custom Field" above.
          </div>
        ) : (
          <div className="divide-y divide-line-subtle rounded-xl border border-line-subtle overflow-hidden">
            {customFields.map((field) => (
              <div key={field.id} className="flex items-center justify-between p-3.5 bg-surface hover:bg-surface-canvas/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-brand/10 p-2 text-brand">
                    <FileText className="size-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-content-strong flex items-center gap-2">
                      {field.nameEn} <span className="text-xs text-content-muted">({field.nameAr})</span>
                      {field.isRequired && <span className="rounded bg-status-error/10 px-1.5 py-0.5 text-[10px] font-bold text-status-error">Required</span>}
                      {!field.isActive && <span className="rounded bg-surface-raised px-1.5 py-0.5 text-[10px] font-semibold text-content-muted">Disabled</span>}
                    </div>
                    <div className="text-xs text-content-subtle mt-0.5">
                      Type: <span className="font-semibold text-content-muted">{field.fieldType}</span>
                      {field.options?.length > 0 && ` • Options: ${field.options.join(', ')}`}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(field)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold border ${
                      field.isActive ? 'border-status-success/30 text-status-success bg-status-success/10' : 'border-line-subtle text-content-muted'
                    }`}
                  >
                    {field.isActive ? 'Active' : 'Inactive'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteField(field.id)}
                    className="p-1.5 text-content-subtle hover:text-status-error hover:bg-status-error/10 rounded-lg transition-colors"
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

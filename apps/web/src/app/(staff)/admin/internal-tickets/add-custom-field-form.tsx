'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { createDepartmentCustomField } from './actions';

interface AddCustomFieldFormProps {
  departmentId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function AddCustomFieldForm({ departmentId, onSuccess, onCancel }: AddCustomFieldFormProps) {
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [fieldType, setFieldType] = useState('TEXT');
  const [optionsStr, setOptionsStr] = useState('');
  const [isRequired, setIsRequired] = useState(false);
  const [placeholderEn, setPlaceholderEn] = useState('');
  const [placeholderAr, setPlaceholderAr] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEn.trim() || !nameAr.trim()) {
      return toast.error('Both English and Arabic field names are required');
    }
    const options =
      fieldType === 'DROPDOWN'
        ? optionsStr.split(',').map((o) => o.trim()).filter(Boolean)
        : [];

    setSaving(true);
    try {
      await createDepartmentCustomField(departmentId, {
        nameEn: nameEn.trim(),
        nameAr: nameAr.trim(),
        fieldType,
        options,
        placeholderEn: placeholderEn.trim() || undefined,
        placeholderAr: placeholderAr.trim() || undefined,
        isRequired,
      });
      toast.success('Custom field created / تم إضافة الحقل بنجاح');
      onSuccess();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create field');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-5 rounded-xl border border-brand/30 bg-surface-canvas p-4 flex flex-col gap-3">
      <div className="text-sm font-bold text-brand">New Custom Field / حقل مخصص جديد</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-content-strong">English Label *</label>
          <input
            required
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
            placeholder="e.g. Asset Serial #"
            className="w-full mt-1 rounded-lg border border-line-subtle bg-surface p-2 text-xs focus:border-brand focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-content-strong">Arabic Label * (الاسم بالعربية)</label>
          <input
            required
            value={nameAr}
            onChange={(e) => setNameAr(e.target.value)}
            placeholder="مثال: الرقم التسلسلي للجهاز"
            className="w-full mt-1 rounded-lg border border-line-subtle bg-surface p-2 text-xs focus:border-brand focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-content-strong">Field Type</label>
          <select
            value={fieldType}
            onChange={(e) => setFieldType(e.target.value)}
            className="w-full mt-1 rounded-lg border border-line-subtle bg-surface p-2 text-xs focus:border-brand focus:outline-none"
          >
            <option value="TEXT">Short Text (نص قصير)</option>
            <option value="NUMBER">Number (رقم)</option>
            <option value="DROPDOWN">Dropdown List (قائمة خيارات)</option>
            <option value="DATE">Date (تاريخ)</option>
            <option value="TEXTAREA">Long Text (نص طويل)</option>
          </select>
        </div>
        {fieldType === 'DROPDOWN' && (
          <div>
            <label className="text-xs font-semibold text-content-strong">Options (comma-separated)</label>
            <input
              value={optionsStr}
              onChange={(e) => setOptionsStr(e.target.value)}
              placeholder="Option 1, Option 2, Option 3"
              className="w-full mt-1 rounded-lg border border-line-subtle bg-surface p-2 text-xs focus:border-brand focus:outline-none"
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mt-1">
        <label className="flex items-center gap-2 text-xs font-semibold text-content-strong cursor-pointer">
          <input
            type="checkbox"
            checked={isRequired}
            onChange={(e) => setIsRequired(e.target.checked)}
            className="rounded text-brand"
          />
          Required field (حقل إلزامي عند إنشاء التذكرة)
        </label>
      </div>

      <div className="flex justify-end gap-2 mt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-content-muted hover:bg-surface-raised"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-brand px-4 py-1.5 text-xs font-bold text-white hover:bg-brand-hover disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Field / حفظ'}
        </button>
      </div>
    </form>
  );
}

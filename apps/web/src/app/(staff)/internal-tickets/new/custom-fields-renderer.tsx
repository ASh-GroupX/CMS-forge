'use client';

import React from 'react';

export interface CustomFieldDef {
  id: string;
  departmentId: string;
  nameEn: string;
  nameAr: string;
  fieldType: 'TEXT' | 'NUMBER' | 'DROPDOWN' | 'DATE' | 'TEXTAREA';
  options: string[];
  placeholderEn: string | null;
  placeholderAr: string | null;
  isRequired: boolean;
  isActive: boolean;
  order: number;
}

interface CustomFieldsRendererProps {
  fields: CustomFieldDef[];
  values: Record<string, any>;
  onChange: (fieldId: string, value: any) => void;
  isAr?: boolean;
}

export function CustomFieldsRenderer({ fields, values, onChange, isAr }: CustomFieldsRendererProps) {
  if (!fields || fields.length === 0) return null;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-line-subtle bg-surface-canvas/40 p-5">
      <div className="flex flex-col">
        <h3 className="text-sm font-bold text-content-strong">
          {isAr ? 'حقول إضافية مطلوبة من القسم' : 'Department Custom Fields'}
        </h3>
        <p className="text-xs text-content-muted">
          {isAr ? 'يرجى تعبئة الحقول المطلوبة من قبل القسم المستهدف' : 'Please provide the additional information requested by the target department'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {fields.map((f) => {
          const label = isAr && f.nameAr ? f.nameAr : f.nameEn;
          const placeholder = isAr && f.placeholderAr ? f.placeholderAr : (f.placeholderEn || '');
          const val = values[f.id] ?? '';

          if (f.fieldType === 'TEXTAREA') {
            return (
              <div key={f.id} className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-sm font-bold text-content-strong">
                  {label} {f.isRequired && <span className="text-status-error">*</span>}
                </label>
                <textarea
                  required={f.isRequired}
                  value={val}
                  placeholder={placeholder}
                  rows={3}
                  onChange={(e) => onChange(f.id, e.target.value)}
                  className="rounded-xl border border-line-subtle bg-surface p-3.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand transition-colors"
                />
              </div>
            );
          }

          if (f.fieldType === 'DROPDOWN') {
            return (
              <div key={f.id} className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-content-strong">
                  {label} {f.isRequired && <span className="text-status-error">*</span>}
                </label>
                <select
                  required={f.isRequired}
                  value={val}
                  onChange={(e) => onChange(f.id, e.target.value)}
                  className="rounded-xl border border-line-subtle bg-surface p-3.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand transition-colors"
                >
                  <option value="">{isAr ? 'اختر خياراً...' : 'Select an option...'}</option>
                  {(f.options || []).map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            );
          }

          if (f.fieldType === 'DATE') {
            return (
              <div key={f.id} className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-content-strong">
                  {label} {f.isRequired && <span className="text-status-error">*</span>}
                </label>
                <input
                  type="date"
                  required={f.isRequired}
                  value={val}
                  onChange={(e) => onChange(f.id, e.target.value)}
                  className="rounded-xl border border-line-subtle bg-surface p-3.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand transition-colors"
                />
              </div>
            );
          }

          if (f.fieldType === 'NUMBER') {
            return (
              <div key={f.id} className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-content-strong">
                  {label} {f.isRequired && <span className="text-status-error">*</span>}
                </label>
                <input
                  type="number"
                  required={f.isRequired}
                  value={val}
                  placeholder={placeholder}
                  onChange={(e) => onChange(f.id, e.target.value === '' ? '' : Number(e.target.value))}
                  className="rounded-xl border border-line-subtle bg-surface p-3.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand transition-colors"
                />
              </div>
            );
          }

          return (
            <div key={f.id} className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-content-strong">
                {label} {f.isRequired && <span className="text-status-error">*</span>}
              </label>
              <input
                type="text"
                required={f.isRequired}
                value={val}
                placeholder={placeholder}
                onChange={(e) => onChange(f.id, e.target.value)}
                className="rounded-xl border border-line-subtle bg-surface p-3.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand transition-colors"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

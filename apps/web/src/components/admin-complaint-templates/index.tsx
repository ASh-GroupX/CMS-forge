'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FormSelect } from '@/components/ui/form-select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader, StateBlock } from '../shared/ui-primitives';
import type { ComplaintFormOptions } from '../../lib/staff-complaint-form-options-api';
import type { Locale } from '../../i18n/staff-shell';
import { getDepartmentTemplates, createComplaintTemplate, updateComplaintTemplate, deleteComplaintTemplate, type ComplaintTemplate, type TemplateField } from '../../lib/api/complaint-templates';
import { Settings, Plus, GripVertical, Trash2, LayoutTemplate, Layers, Check, Search, Calendar, ChevronDown, ListFilter, Play, Eye, Copy } from 'lucide-react';

export function AdminComplaintTemplates({
  locale,
  options,
  csrfToken,
}: {
  locale: Locale;
  options: ComplaintFormOptions | null;
  csrfToken: string;
}) {
  const isRtl = locale === 'ar';
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [templates, setTemplates] = useState<ComplaintTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<ComplaintTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const branches = options?.branches ?? [];
  const departments = options?.departments ?? [];
  const filteredDepartments = selectedBranch
    ? departments.filter((d: any) => !d.branchId || d.branchId === selectedBranch)
    : departments;

  useEffect(() => {
    if (selectedDepartment) {
      loadTemplates();
    } else {
      setTemplates([]);
    }
  }, [selectedDepartment]);

  async function loadTemplates() {
    try {
      setLoading(true);
      setError(null);
      const data = await getDepartmentTemplates(selectedDepartment);
      setTemplates(data);
    } catch (err: any) {
      // If unauthorized, redirect to staff login
      if (err?.message?.includes('401') || err?.message?.includes('Invalid credentials')) {
        if (typeof window !== 'undefined') {
          const loginUrl = `/?locale=${locale}&auth=required`;
          window.location.href = loginUrl;
          return;
        }
      }
      setError(err?.message || (isRtl ? 'فشل تحميل القوالب' : 'Failed to load templates'));
    } finally {
      setLoading(false);
    }
  }

  function handleAdd() {
    setEditingTemplate(null);
    setIsCreating(true);
  }

  function handleEdit(t: ComplaintTemplate) {
    setEditingTemplate(t);
    setIsCreating(false);
  }

  function handleClone(t: ComplaintTemplate) {
    setEditingTemplate(t);
    setIsCreating(true);
  }

  async function handleDelete(id: string) {
    if (!window.confirm(isRtl ? 'هل أنت متأكد من حذف هذا القالب؟' : 'Are you sure you want to delete this template?')) return;
    try {
      setLoading(true);
      await deleteComplaintTemplate(id);
      await loadTemplates();
    } catch (err: any) {
      setError(err?.message || (isRtl ? 'فشل حذف القالب' : 'Failed to delete template'));
    } finally {
      setLoading(false);
    }
  }

  function handleCancel() {
    setEditingTemplate(null);
    setIsCreating(false);
  }

  return (
    <section className="grid gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500" dir={isRtl ? 'rtl' : 'ltr'}>
      <PageHeader 
        title={isRtl ? 'إدارة قوالب الأقسام' : 'Department Templates Manager'} 
        description={isRtl ? 'قم بإنشاء وتخصيص نماذج الشكاوى الديناميكية لأقسامك.' : 'Create and customize dynamic complaint forms for your departments.'} 
        eyebrow={isRtl ? 'الإدارة' : 'Admin'} 
      />

      {error && <StateBlock message={error} tone="error" />}

      {(!isCreating && !editingTemplate) && (
        <div className="grid gap-6 md:grid-cols-12">
          {/* Sidebar Config */}
          <div className="md:col-span-4 space-y-6">
            <Card className="rounded-2xl border-line-subtle shadow-xl bg-surface/60 backdrop-blur-xl">
              <CardHeader className="border-b border-line-subtle/50 pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="p-2 bg-brand/10 text-brand rounded-lg"><Layers className="size-4" /></div>
                  {isRtl ? 'تحديد السياق' : 'Context Selection'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 grid gap-5">
                <div className="grid gap-2">
                  <label className="text-sm font-semibold text-content-strong">{isRtl ? 'الفرع' : 'Branch'}</label>
                  <FormSelect
                    id="branchId"
                    name="branchId"
                    options={branches.map(b => ({ label: isRtl ? b.nameAr : b.nameEn, value: b.id }))}
                    placeholder={isRtl ? 'اختر الفرع' : 'Select Branch'}
                    value={selectedBranch}
                    onValueChange={(val) => {
                      setSelectedBranch(val);
                      setSelectedDepartment('');
                    }}
                  />
                </div>
                <div className="grid gap-2 animate-in fade-in slide-in-from-top-2">
                  <label className="text-sm font-semibold text-content-strong">{isRtl ? 'القسم' : 'Department'}</label>
                  <FormSelect
                    id="departmentId"
                    name="departmentId"
                    options={filteredDepartments.map(d => ({ label: isRtl ? d.nameAr : d.nameEn, value: d.id }))}
                    placeholder={isRtl ? 'اختر القسم' : 'Select Department'}
                    value={selectedDepartment}
                    onValueChange={setSelectedDepartment}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Templates List */}
          <div className="md:col-span-8">
            <Card className="rounded-2xl border-line-subtle shadow-xl bg-surface/60 backdrop-blur-xl h-full min-h-[400px]">
              <CardHeader className="flex flex-row items-center justify-between border-b border-line-subtle/50 pb-4">
                <div>
                  <CardTitle className="text-lg">{isRtl ? 'القوالب الحالية' : 'Current Templates'}</CardTitle>
                  <CardDescription className="mt-1">{isRtl ? 'اختر قالباً للتعديل أو أضف قالباً جديداً' : 'Select a template to edit or create a new one'}</CardDescription>
                </div>
                <Button 
                  onClick={handleAdd} 
                  disabled={!selectedDepartment}
                  className="rounded-xl shadow-lg bg-gradient-to-r from-brand to-brand/80 hover:from-brand hover:to-brand transition-all gap-2"
                >
                  <Plus className="size-4" />
                  {isRtl ? 'قالب جديد' : 'New Template'}
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {!selectedDepartment ? (
                  <div className="flex flex-col items-center justify-center h-64 text-content-muted">
                    <LayoutTemplate className="size-12 mb-4 opacity-20" />
                    <p>{isRtl ? 'يرجى تحديد القسم أولاً' : 'Please select a department first'}</p>
                  </div>
                ) : loading ? (
                  <div className="flex flex-col items-center justify-center h-64 text-content-muted">
                    <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin mb-4" />
                    <p>{isRtl ? 'جاري التحميل...' : 'Loading templates...'}</p>
                  </div>
                ) : templates.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-content-muted">
                    <div className="p-4 bg-surface-raised rounded-full mb-4">
                      <LayoutTemplate className="size-8 opacity-50" />
                    </div>
                    <p>{isRtl ? 'لا توجد قوالب. ابدأ بإنشاء قالب جديد.' : 'No templates found. Create your first one.'}</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-line-subtle/50">
                    {templates.map(t => (
                      <li key={t.id} className="group flex items-center justify-between p-5 hover:bg-surface-raised transition-colors">
                        <div className="flex items-start gap-4">
                          <div className={`mt-1 p-2 rounded-lg ${t.isActive ? 'bg-status-success/10 text-status-success' : 'bg-status-error/10 text-status-error'}`}>
                            <LayoutTemplate className="size-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-content-strong text-base">{t.name}</h3>
                            {t.description && <p className="text-sm text-content-muted mt-1 max-w-lg">{t.description}</p>}
                            <div className="flex items-center gap-3 mt-2 text-xs text-content-muted">
                              <span className="flex items-center gap-1"><Layers className="size-3" /> {t.schema?.length || 0} {isRtl ? 'حقول' : 'Fields'}</span>
                              <span className={`px-2 py-0.5 rounded-full ${t.isActive ? 'bg-status-success/10 text-status-success' : 'bg-status-error/10 text-status-error'}`}>
                                {t.isActive ? (isRtl ? 'نشط' : 'Active') : (isRtl ? 'غير نشط' : 'Inactive')}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="outline" size="sm" onClick={() => handleClone(t)} className="rounded-lg text-content-muted hover:text-content-strong">
                            <Copy className="size-4 mr-1.5 rtl:mr-0 rtl:ml-1.5" />
                            {isRtl ? 'نسخ' : 'Clone'}
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleEdit(t)} className="rounded-lg">
                            {isRtl ? 'تعديل' : 'Edit'}
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDelete(t.id)} className="rounded-lg text-status-error hover:bg-status-error/10 hover:border-status-error/30">
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {(isCreating || editingTemplate) && (
        <TemplateEditor 
          locale={locale}
          departmentId={selectedDepartment}
          template={editingTemplate}
          isClone={isCreating && !!editingTemplate}
          onCancel={handleCancel}
          onSave={() => {
            handleCancel();
            loadTemplates();
          }}
        />
      )}
    </section>
  );
}

function TemplateEditor({
  locale,
  departmentId,
  template,
  isClone = false,
  onCancel,
  onSave,
}: {
  locale: Locale;
  departmentId: string;
  template: ComplaintTemplate | null;
  isClone?: boolean;
  onCancel: () => void;
  onSave: () => void;
}) {
  const isRtl = locale === 'ar';
  const [name, setName] = useState(template ? (isClone ? `${template.name} (Copy)` : template.name) : '');
  const [description, setDescription] = useState(template?.description ?? '');
  const [isActive, setIsActive] = useState(template?.isActive ?? true);
  const [schema, setSchema] = useState<TemplateField[]>(template?.schema ?? []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Focus state for live preview
  const [activeFieldIndex, setActiveFieldIndex] = useState<number | null>(null);

  function addField(type: 'text' | 'long_text' | 'number' | 'date' | 'dropdown' | 'checkbox' | 'radio' = 'text') {
    const newField: TemplateField = {
      id: `field_${Date.now()}`,
      label: 'New Field',
      type,
      required: false,
      options: ['dropdown', 'checkbox', 'radio'].includes(type) ? ['Option 1', 'Option 2'] : [],
    };
    setSchema([...schema, newField]);
    setActiveFieldIndex(schema.length);
  }

  function updateField(index: number, updates: Partial<TemplateField>) {
    const newSchema = [...schema];
    newSchema[index] = { ...newSchema[index], ...updates } as TemplateField;
    setSchema(newSchema);
  }

  function removeField(index: number) {
    const newSchema = [...schema];
    newSchema.splice(index, 1);
    setSchema(newSchema);
    if (activeFieldIndex === index) setActiveFieldIndex(null);
  }

  function moveField(index: number, direction: -1 | 1) {
    if (index + direction < 0 || index + direction >= schema.length) return;
    const newSchema = [...schema];
    const temp = newSchema[index]!;
    newSchema[index] = newSchema[index + direction]!;
    newSchema[index + direction] = temp;
    setSchema(newSchema);
    setActiveFieldIndex(index + direction);
  }

  async function handleSave() {
    if (!name.trim()) {
      setError(isRtl ? 'الاسم مطلوب' : 'Name is required');
      return;
    }
    
    // Validate schema
    const ids = new Set();
    for (const field of schema) {
      if (!field.id.trim() || !field.label.trim()) {
        setError(isRtl ? 'جميع الحقول يجب أن تحتوي على معرف وتسمية' : 'All fields must have an ID and a Label');
        return;
      }
      if (!/^[a-zA-Z0-9_]+$/.test(field.id)) {
        setError(isRtl ? 'معرف الحقل يجب أن يحتوي على أحرف إنجليزية وأرقام فقط' : 'Field ID must be alphanumeric and underscores only');
        return;
      }
      if (ids.has(field.id)) {
        setError(isRtl ? `المعرف ${field.id} مكرر` : `Field ID ${field.id} is duplicated`);
        return;
      }
      ids.add(field.id);
    }

    try {
      setLoading(true);
      setError(null);
      if (template && !isClone) {
        await updateComplaintTemplate(template.id, { name, description, isActive, schema });
      } else {
        await createComplaintTemplate(departmentId, { name, description, isActive, schema });
      }
      onSave();
    } catch (err: any) {
      setError(err.message || (isRtl ? 'فشل حفظ القالب' : 'Failed to save template'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-12 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      {/* Editor Pane */}
      <div className="lg:col-span-7 space-y-6">
        <Card className="rounded-2xl border-line-subtle shadow-2xl bg-surface/80 backdrop-blur-2xl">
          <CardHeader className="border-b border-line-subtle/50 pb-4 flex flex-row items-center justify-between sticky top-0 bg-surface/80 backdrop-blur-2xl z-20 rounded-t-2xl">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Settings className="size-5 text-brand" />
                {template ? (isRtl ? 'تعديل القالب' : 'Edit Template') : (isRtl ? 'قالب جديد' : 'New Template')}
              </CardTitle>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onCancel} disabled={loading} className="rounded-xl">
                {isRtl ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button onClick={handleSave} disabled={loading} className="rounded-xl shadow-lg bg-gradient-to-r from-brand to-brand/80 hover:from-brand hover:to-brand">
                {loading ? (isRtl ? 'جاري الحفظ...' : 'Saving...') : (isRtl ? 'حفظ' : 'Save')}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6 grid gap-8">
            {error && <StateBlock message={error} tone="error" />}
            
            <div className="grid gap-5 bg-surface-raised p-5 rounded-2xl border border-line-subtle/50">
              <div className="grid gap-2">
                <label className="text-sm font-semibold">{isRtl ? 'الاسم' : 'Template Name'}</label>
                <Input value={name} onChange={e => setName(e.target.value)} className="text-lg font-medium rounded-xl border-line-subtle bg-surface" placeholder={isRtl ? 'مثال: تحقيق الصيانة' : 'e.g. Maintenance Investigation'} />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-semibold">{isRtl ? 'الوصف' : 'Description'}</label>
                <Input value={description} onChange={e => setDescription(e.target.value)} className="rounded-xl border-line-subtle bg-surface" />
              </div>
              <label className="flex items-center gap-3 text-sm font-semibold cursor-pointer select-none w-max">
                <div className={`flex items-center justify-center size-5 rounded border transition-colors ${isActive ? 'bg-brand border-brand text-white' : 'border-line-subtle'}`}>
                  <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="sr-only" />
                  {isActive && <Check className="size-3.5" />}
                </div>
                {isRtl ? 'القالب متاح للاستخدام' : 'Template is active and ready to use'}
              </label>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <ListFilter className="size-5 text-brand" />
                  {isRtl ? 'حقول النموذج' : 'Form Fields'}
                </h3>
              </div>

              {/* Toolbox */}
              <div className="flex flex-wrap gap-2 p-2 bg-surface-raised rounded-xl border border-line-subtle/50">
                {[
                  { type: 'text', icon: <span className="font-serif italic text-xs font-bold">T</span>, label: 'Text' },
                  { type: 'long_text', icon: <span className="font-serif italic text-xs font-bold">Para</span>, label: 'Textarea' },
                  { type: 'number', icon: <span className="font-mono text-xs font-bold">123</span>, label: 'Number' },
                  { type: 'date', icon: <Calendar className="size-3" />, label: 'Date' },
                  { type: 'dropdown', icon: <ChevronDown className="size-3" />, label: 'Dropdown' },
                  { type: 'checkbox', icon: <Check className="size-3" />, label: 'Checkbox' },
                  { type: 'radio', icon: <div className="size-2 rounded-full border border-current" />, label: 'Radio' },
                ].map((t) => (
                  <Button 
                    key={t.type} 
                    variant="outline" 
                    size="sm" 
                    onClick={() => addField(t.type as any)}
                    className="h-8 text-xs gap-1.5 rounded-lg bg-surface hover:bg-surface hover:border-brand/50 hover:text-brand transition-colors"
                  >
                    {t.icon} {t.label}
                  </Button>
                ))}
              </div>
              
              {schema.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-line-subtle rounded-2xl bg-surface-raised/50 text-content-muted">
                  <ListFilter className="size-8 mb-3 opacity-20" />
                  <p>{isRtl ? 'أضف حقلاً لبدء تصميم النموذج' : 'Add a field to start building the form'}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {schema.map((field, idx) => {
                    const isActiveField = activeFieldIndex === idx;
                    return (
                      <div 
                        key={field.id + idx} 
                        className={`group rounded-2xl border transition-all duration-300 ${isActiveField ? 'border-brand bg-brand/5 shadow-[0_0_0_4px_rgba(37,99,235,0.1)]' : 'border-line-subtle bg-surface hover:border-brand/50'}`}
                        onClick={() => setActiveFieldIndex(idx)}
                      >
                        <div className="flex items-center justify-between p-3 border-b border-black/5 bg-black/5 cursor-pointer rounded-t-2xl">
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col gap-0.5 px-1 py-2 text-content-muted hover:text-content-strong cursor-ns-resize opacity-50 group-hover:opacity-100 transition-opacity">
                              <button type="button" onClick={(e) => { e.stopPropagation(); moveField(idx, -1); }} disabled={idx === 0} className="disabled:opacity-20"><ChevronDown className="size-3 rotate-180" /></button>
                              <button type="button" onClick={(e) => { e.stopPropagation(); moveField(idx, 1); }} disabled={idx === schema.length - 1} className="disabled:opacity-20"><ChevronDown className="size-3" /></button>
                            </div>
                            <div>
                              <span className="font-semibold text-sm">{field.label || 'Untitled Field'}</span>
                              <span className="ml-2 text-xs text-content-muted bg-surface-canvas px-1.5 py-0.5 rounded-md font-mono">{field.type}</span>
                              {field.required && <span className="ml-2 text-xs text-status-error">*</span>}
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); removeField(idx); }} className="text-content-muted hover:text-status-error hover:bg-status-error/10 rounded-xl size-8">
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                        
                        {isActiveField && (
                          <div className="p-4 grid gap-4 animate-in slide-in-from-top-2 duration-300">
                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="grid gap-2">
                                <label className="text-xs font-semibold text-content-muted">Field Label</label>
                                <Input value={field.label} onChange={e => updateField(idx, { label: e.target.value })} className="h-9 rounded-lg" />
                              </div>
                              <div className="grid gap-2">
                                <label className="text-xs font-semibold text-content-muted">Field ID (Unique Variable)</label>
                                <Input value={field.id} onChange={e => updateField(idx, { id: e.target.value })} className="h-9 rounded-lg font-mono text-sm" />
                              </div>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2 items-center">
                              <div className="grid gap-2">
                                <label className="text-xs font-semibold text-content-muted">Field Type</label>
                                <FormSelect 
                                  id={`f_type_${idx}`} 
                                  value={field.type} 
                                  options={['text', 'long_text', 'number', 'date', 'dropdown', 'checkbox', 'radio'].map(t => ({label: t, value: t}))}
                                  onValueChange={v => {
                                    const t = v as any;
                                    const needsOptions = ['dropdown', 'checkbox', 'radio'].includes(t);
                                    updateField(idx, { type: t, options: needsOptions ? (field.options?.length ? field.options : ['Option 1']) : [] });
                                  }}
                                  placeholder="Select type"
                                />
                              </div>
                              <div className="pt-6">
                                <label className="flex items-center gap-3 text-sm font-semibold cursor-pointer select-none w-max">
                                  <div className={`flex items-center justify-center size-5 rounded border transition-colors ${field.required ? 'bg-brand border-brand text-white' : 'border-line-subtle bg-surface'}`}>
                                    <input type="checkbox" checked={field.required} onChange={e => updateField(idx, { required: e.target.checked })} className="sr-only" />
                                    {field.required && <Check className="size-3.5" />}
                                  </div>
                                  Required Field
                                </label>
                              </div>
                            </div>
                            {['dropdown', 'checkbox', 'radio'].includes(field.type) && (
                              <div className="grid gap-2 p-3 bg-brand/5 rounded-xl border border-brand/10">
                                <label className="text-xs font-semibold text-content-strong flex justify-between">
                                  <span>Options</span>
                                  <span className="text-content-muted font-normal">(Comma separated)</span>
                                </label>
                                <Textarea 
                                  value={field.options?.join(', ') || ''} 
                                  onChange={e => updateField(idx, { options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} 
                                  className="min-h-[60px] rounded-lg border-line-subtle text-sm" 
                                  placeholder="Option A, Option B, Option C"
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Preview Pane */}
      <div className="lg:col-span-5 h-full">
        <div className="sticky top-6">
          <Card className="rounded-2xl border-line-subtle shadow-xl bg-surface overflow-hidden">
            <CardHeader className="bg-brand/5 border-b border-brand/10 py-3 px-5 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-brand flex items-center gap-2">
                <Eye className="size-4" />
                {isRtl ? 'معاينة حية' : 'Live Preview'}
              </CardTitle>
              <div className="flex gap-1">
                <div className="size-2.5 rounded-full bg-status-error/50"></div>
                <div className="size-2.5 rounded-full bg-status-warning/50"></div>
                <div className="size-2.5 rounded-full bg-status-success/50"></div>
              </div>
            </CardHeader>
            <CardContent className="p-6 bg-surface-canvas min-h-[500px]">
              <div className="max-w-md mx-auto bg-surface p-6 rounded-2xl border border-line-subtle shadow-md space-y-6">
                <div>
                  <h2 className="text-xl font-bold">{name || (isRtl ? 'عنوان النموذج' : 'Form Title')}</h2>
                  <p className="text-sm text-content-muted mt-1">{description || (isRtl ? 'وصف النموذج يظهر هنا...' : 'Form description appears here...')}</p>
                </div>
                
                <hr className="border-line-subtle" />

                <div className="space-y-5">
                  {schema.length === 0 ? (
                    <div className="text-center p-8 text-sm text-content-muted border border-dashed rounded-xl border-line-subtle">
                      {isRtl ? 'النموذج فارغ' : 'Form is empty'}
                    </div>
                  ) : (
                    schema.map((field, idx) => (
                      <div key={idx} className={`space-y-1.5 transition-opacity ${activeFieldIndex !== null && activeFieldIndex !== idx ? 'opacity-50' : 'opacity-100'}`}>
                        <label className="text-sm font-semibold text-content-strong flex gap-1">
                          {field.label || 'Untitled'}
                          {field.required && <span className="text-status-error">*</span>}
                        </label>
                        
                        {field.type === 'text' && <Input disabled className="bg-surface-raised h-9 rounded-lg" placeholder="Text input..." />}
                        {field.type === 'long_text' && <Textarea disabled className="bg-surface-raised min-h-[80px] rounded-lg" placeholder="Long text..." />}
                        {field.type === 'number' && <Input disabled type="number" className="bg-surface-raised h-9 rounded-lg" placeholder="123" />}
                        {field.type === 'date' && (
                          <div className="relative">
                            <Input disabled className="bg-surface-raised h-9 rounded-lg" placeholder="YYYY-MM-DD" />
                            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-content-muted" />
                          </div>
                        )}
                        {field.type === 'dropdown' && (
                          <div className="h-9 border border-line-subtle bg-surface-raised rounded-lg px-3 flex items-center justify-between text-sm text-content-muted">
                            <span>Select...</span>
                            <ChevronDown className="size-4" />
                          </div>
                        )}
                        {field.type === 'checkbox' && (
                          <div className="space-y-2 pt-1">
                            {(field.options?.length ? field.options : ['Option 1']).map((opt, i) => (
                              <label key={i} className="flex items-center gap-2 text-sm text-content-muted">
                                <div className="size-4 rounded border border-line-subtle bg-surface-raised" />
                                {opt}
                              </label>
                            ))}
                          </div>
                        )}
                        {field.type === 'radio' && (
                          <div className="space-y-2 pt-1">
                            {(field.options?.length ? field.options : ['Option 1']).map((opt, i) => (
                              <label key={i} className="flex items-center gap-2 text-sm text-content-muted">
                                <div className="size-4 rounded-full border border-line-subtle bg-surface-raised" />
                                {opt}
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


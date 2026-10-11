'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Loader2, Plus, Pencil, Check, X, Trash2 } from 'lucide-react';
import { fetchStandardProblems, createStandardProblem, updateStandardProblem, deleteStandardProblem, StandardProblemView } from '../../lib/admin-standard-problems-api';
import type { ComplaintFormOptions } from '../../lib/staff-complaint-form-options-api';
import { resolveLocale, staffShellText } from '../../i18n/staff-shell';

function localizedName(item: { nameAr?: string | null; nameEn: string }, locale: 'en' | 'ar'): string {
  return locale === 'ar' && item.nameAr ? item.nameAr : item.nameEn;
}

type AdminStandardProblemsProps = {
  locale: 'en' | 'ar';
  options: ComplaintFormOptions | null;
  csrfToken: string;
};

export function AdminStandardProblems({ locale, options, csrfToken }: AdminStandardProblemsProps) {
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');
  const [problems, setProblems] = useState<StandardProblemView[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitleEn, setEditTitleEn] = useState('');
  const [editTitleAr, setEditTitleAr] = useState('');
  
  const [isAdding, setIsAdding] = useState(false);
  const [newTitleEn, setNewTitleEn] = useState('');
  const [newTitleAr, setNewTitleAr] = useState('');

  const shell = staffShellText[locale];
  const departments = options?.departments ?? [];
  const isArabic = locale === 'ar';

  const t = {
    title: isArabic ? 'المشاكل الشائعة' : 'Standard Problems',
    subtitle: isArabic ? 'إدارة قوالب المشاكل الشائعة لكل قسم.' : 'Manage common problem templates for each department.',
    selectDept: isArabic ? 'اختر القسم...' : 'Select a department...',
    noProblems: isArabic ? 'لا توجد مشاكل شائعة لهذا القسم.' : 'No standard problems found for this department.',
    addProblem: isArabic ? 'إضافة مشكلة شائعة' : 'Add Standard Problem',
    titleEn: isArabic ? 'العنوان بالإنجليزية' : 'Title (English)',
    titleAr: isArabic ? 'العنوان بالعربية' : 'Title (Arabic)',
    save: isArabic ? 'حفظ' : 'Save',
    cancel: isArabic ? 'إلغاء' : 'Cancel',
    edit: isArabic ? 'تعديل' : 'Edit',
    delete: isArabic ? 'حذف' : 'Delete',
  };

  useEffect(() => {
    if (selectedDepartmentId) {
      loadProblems(selectedDepartmentId);
    } else {
      setProblems([]);
    }
  }, [selectedDepartmentId]);

  async function loadProblems(deptId: string) {
    setIsLoading(true);
    try {
      const data = await fetchStandardProblems(deptId);
      setProblems(data);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAdd() {
    if (!selectedDepartmentId || !newTitleEn || !newTitleAr) return;
    setIsLoading(true);
    try {
      const added = await createStandardProblem(selectedDepartmentId, { titleEn: newTitleEn, titleAr: newTitleAr }, csrfToken);
      if (added) {
        setProblems((prev) => [...prev, added]);
        setIsAdding(false);
        setNewTitleEn('');
        setNewTitleAr('');
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUpdate(id: string) {
    if (!editTitleEn || !editTitleAr) return;
    setIsLoading(true);
    try {
      const updated = await updateStandardProblem(id, { titleEn: editTitleEn, titleAr: editTitleAr }, csrfToken);
      if (updated) {
        setProblems((prev) => prev.map((p) => p.id === id ? updated : p));
        setEditingId(null);
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm(isArabic ? 'هل أنت متأكد من حذف هذه المشكلة؟' : 'Are you sure you want to delete this problem?')) return;
    setIsLoading(true);
    try {
      const success = await deleteStandardProblem(id, csrfToken);
      if (success) {
        setProblems((prev) => prev.filter((p) => p.id !== id));
      }
    } finally {
      setIsLoading(false);
    }
  }

  function startEdit(p: StandardProblemView) {
    setEditingId(p.id);
    setEditTitleEn(p.titleEn);
    setEditTitleAr(p.titleAr);
  }

  return (
    <Card className="rounded-md shadow-sm" dir={shell.dir}>
      <CardHeader className="border-b p-4">
        <CardTitle className="text-lg tracking-normal">{t.title}</CardTitle>
        <CardDescription className="mt-1 text-sm">{t.subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 space-y-6">
        <div className="max-w-md">
          <Select value={selectedDepartmentId} onValueChange={setSelectedDepartmentId} disabled={isLoading}>
            <SelectTrigger>
              <SelectValue placeholder={t.selectDept} />
            </SelectTrigger>
            <SelectContent>
              {departments.map(dept => (
                <SelectItem key={dept.id} value={dept.id}>
                  {localizedName(dept, locale)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedDepartmentId && (
          <div className="space-y-4 border rounded-md p-4 bg-muted/20">
            {isLoading && problems.length === 0 ? (
              <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : problems.length === 0 && !isAdding ? (
              <p className="text-sm text-muted-foreground text-center py-4">{t.noProblems}</p>
            ) : (
              <div className="space-y-3">
                {problems.map(p => (
                  <div key={p.id} className="flex items-center gap-3 p-3 bg-background border rounded-md shadow-sm">
                    {editingId === p.id ? (
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <Input value={editTitleEn} onChange={(e) => setEditTitleEn(e.target.value)} placeholder={t.titleEn} disabled={isLoading} />
                        <Input value={editTitleAr} onChange={(e) => setEditTitleAr(e.target.value)} placeholder={t.titleAr} disabled={isLoading} dir="rtl" />
                      </div>
                    ) : (
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <span className="text-sm font-medium">{p.titleEn}</span>
                        <span className="text-sm font-medium" dir="rtl">{p.titleAr}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-1 shrink-0">
                      {editingId === p.id ? (
                        <>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={() => handleUpdate(p.id)} disabled={isLoading}><Check className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setEditingId(null)} disabled={isLoading}><X className="h-4 w-4" /></Button>
                        </>
                      ) : (
                        <>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => startEdit(p)} disabled={isLoading || editingId !== null}><Pencil className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(p.id)} disabled={isLoading || editingId !== null}><Trash2 className="h-4 w-4" /></Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {isAdding ? (
              <div className="flex items-center gap-3 p-3 bg-background border border-primary/20 rounded-md shadow-sm mt-4">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <Input value={newTitleEn} onChange={(e) => setNewTitleEn(e.target.value)} placeholder={t.titleEn} disabled={isLoading} autoFocus />
                  <Input value={newTitleAr} onChange={(e) => setNewTitleAr(e.target.value)} placeholder={t.titleAr} disabled={isLoading} dir="rtl" />
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={handleAdd} disabled={isLoading || !newTitleEn || !newTitleAr}><Check className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setIsAdding(false)} disabled={isLoading}><X className="h-4 w-4" /></Button>
                </div>
              </div>
            ) : (
              <Button variant="outline" className="w-full mt-4" onClick={() => setIsAdding(true)} disabled={isLoading || editingId !== null}>
                <Plus className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" /> {t.addProblem}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

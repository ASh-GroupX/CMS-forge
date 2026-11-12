'use client';
import React, { useState } from 'react';
import type { PortalField, PortalFieldType } from '../../../../../packages/contracts/src/portal-form';
import type { Locale } from '../../i18n/staff-shell';
import { loadPortalFields, savePortalFields } from '../../app/(staff)/admin/portal-intake/fields/actions';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';

type Initial = Awaited<ReturnType<typeof loadPortalFields>>;
const types: PortalFieldType[] = ['text', 'textarea', 'number', 'date', 'select', 'checkbox'];
const choiceDrafts = (fields: PortalField[]) => Object.fromEntries(fields.filter((field) => field.type === 'select').map((field) => [field.key, (field.options ?? []).map((choice) => `${choice.value} | ${choice.labelEn} | ${choice.labelAr}`).join('\n')]));
const words = {
  en: { title: 'QR complaint fields', intro: 'Choose what customers must provide. VIN starts as required; every field can be optional. Added fields stay with submitted complaints even if you disable them later.', required: 'Required', enabled: 'Shown', english: 'English label', arabic: 'Arabic label', choices: 'Choices', choiceHelp: 'One choice per line: value | English label | Arabic label', add: 'Add field', save: 'Save fields', saving: 'Saving…', saved: 'Fields saved.', reload: 'Reload', conflict: 'Someone changed these fields. Reload to see the latest version.', error: 'Could not load or save fields.', validation: 'Check field labels and choices.', forbidden: 'Access denied.', type: 'Field type', disabled: 'Disabled fields remain on earlier complaints.' },
  ar: { title: 'حقول شكوى رمز QR', intro: 'حدد الحقول المطلوبة من العميل. رقم الهيكل مطلوب مبدئياً، ويمكن جعل أي حقل اختيارياً. تبقى الحقول المضافة في الشكاوى السابقة حتى بعد إخفائها.', required: 'إلزامي', enabled: 'ظاهر', english: 'التسمية بالإنجليزية', arabic: 'التسمية بالعربية', choices: 'الخيارات', choiceHelp: 'خيار في كل سطر: القيمة | الاسم بالإنجليزية | الاسم بالعربية', add: 'إضافة حقل', save: 'حفظ الحقول', saving: 'جارٍ الحفظ…', saved: 'تم حفظ الحقول.', reload: 'إعادة التحميل', conflict: 'تم تغيير الحقول. أعد التحميل لعرض النسخة الجديدة.', error: 'تعذر تحميل الحقول أو حفظها.', validation: 'تحقق من الأسماء والخيارات.', forbidden: 'غير مصرح.', type: 'نوع الحقل', disabled: 'تبقى الحقول المخفية في الشكاوى السابقة.' },
};
export function PortalFieldsSettings({ initial, locale }: { initial: Initial; locale: Locale }) {
  const t = words[locale];
  const [result, setResult] = useState(initial);
  const [fields, setFields] = useState<PortalField[]>(initial.status === 'ok' ? initial.data.fields : []);
  const [choices, setChoices] = useState<Record<string, string>>(() => initial.status === 'ok' ? choiceDrafts(initial.data.fields) : {});
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const update = (key: string, patch: Partial<PortalField>) => setFields((items) => items.map((item) => item.key === key ? { ...item, ...patch } : item));
  async function reload() {
    setBusy(true); const next = await loadPortalFields(); setResult(next); if (next.status === 'ok') { setFields(next.data.fields); setChoices(choiceDrafts(next.data.fields)); } setNotice(''); setBusy(false);
  }
  async function save() {
    if (result.status !== 'ok') return;
    setBusy(true); setNotice('');
    const prepared = fields.map((field) => field.type === 'select' ? { ...field, options: (choices[field.key] ?? '').split('\n').filter(Boolean).map((row) => { const [value = '', labelEn = '', labelAr = ''] = row.split('|').map((part) => part.trim()); return { value, labelEn, labelAr }; }) } : field);
    const next = await savePortalFields({ expectedVersion: result.data.version, fields: prepared });
    if (next.status === 'ok') { setResult(next); setFields(next.data.fields); setChoices(choiceDrafts(next.data.fields)); setNotice(t.saved); }
    else setNotice(t[next.status]);
    setBusy(false);
  }
  function add() { setFields((items) => [...items, { key: `custom_${crypto.randomUUID().replaceAll('-', '')}`, labelEn: '', labelAr: '', type: 'text', required: false, enabled: true }]); }
  return <main dir={locale === 'ar' ? 'rtl' : 'ltr'} className="mx-auto grid max-w-5xl gap-5">
    <header className="grid gap-2"><h1 className="text-2xl font-semibold text-content-strong">{t.title}</h1><p className="max-w-3xl text-sm text-content-muted">{t.intro}</p></header>
    {notice && <Alert><AlertDescription role="status">{notice}</AlertDescription></Alert>}
    {result.status !== 'ok' ? <Alert><AlertDescription>{t[result.status]} <Button type="button" onClick={reload} disabled={busy}>{t.reload}</Button></AlertDescription></Alert> : <>
      <div className="grid gap-3">{fields.map((field) => <Card key={field.key}><CardHeader className="pb-2"><CardTitle className="text-base">{locale === 'ar' ? field.labelAr || field.key : field.labelEn || field.key}</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2"><Label htmlFor={`${field.key}-en`}>{t.english}</Label><Input id={`${field.key}-en`} value={field.labelEn} maxLength={200} onChange={(event) => update(field.key, { labelEn: event.target.value })} /></div>
        <div className="grid gap-2"><Label htmlFor={`${field.key}-ar`}>{t.arabic}</Label><Input id={`${field.key}-ar`} value={field.labelAr} maxLength={200} onChange={(event) => update(field.key, { labelAr: event.target.value })} /></div>
        {field.key.startsWith('custom_') && <div className="grid gap-2"><Label htmlFor={`${field.key}-type`}>{t.type}</Label><Select value={field.type} onValueChange={(type) => update(field.key, { type: type as PortalFieldType, ...(type === 'select' ? { options: field.options ?? [] } : {}) })}><SelectTrigger id={`${field.key}-type`}><SelectValue /></SelectTrigger><SelectContent>{types.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select></div>}
        <div className="flex flex-wrap items-center gap-5"><Label className="flex items-center gap-2"><Checkbox checked={field.required} onCheckedChange={(value) => update(field.key, { required: value === true })} />{t.required}</Label>{field.key.startsWith('custom_') && <Label className="flex items-center gap-2"><Checkbox checked={field.enabled} onCheckedChange={(value) => update(field.key, { enabled: value === true })} />{t.enabled}</Label>}</div>
        {field.type === 'select' && <div className="grid gap-2 sm:col-span-2"><Label htmlFor={`${field.key}-choices`}>{t.choices}</Label><Textarea id={`${field.key}-choices`} value={choices[field.key] ?? ''} onChange={(event) => setChoices((current) => ({ ...current, [field.key]: event.target.value }))} /><p className="text-xs text-content-muted">{t.choiceHelp}</p></div>}
      </CardContent></Card>)}</div>
      <p className="text-sm text-content-muted">{t.disabled}</p>
      <div className="flex flex-wrap gap-3"><Button type="button" variant="outline" onClick={add} disabled={busy}>{t.add}</Button><Button type="button" onClick={save} disabled={busy}>{busy ? t.saving : t.save}</Button><Button type="button" variant="outline" onClick={reload} disabled={busy}>{t.reload}</Button></div>
    </>}
  </main>;
}

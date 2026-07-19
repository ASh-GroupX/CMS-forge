'use client';

import { ArchiveIcon, ChevronDown, ChevronUp, Plus, Settings2 } from 'lucide-react';
import React, { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { FormSelect } from '@/components/ui/form-select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { staffShellText, type Locale } from '../../i18n/staff-shell';
import { taskBoardText } from '../../i18n/staff-task-board';
import type { BoardStage } from '../../lib/staff-board-api';
import type { CreateStagePayload, StageWriteResult, UpdateStagePayload } from '../../lib/staff-board-stages-api';
import type { StaffTaskStatus } from '../../lib/staff-tasks-api';

const COLOR_DOT: Record<string, string> = {
  slate: 'bg-stage-slate', blue: 'bg-stage-blue', amber: 'bg-stage-amber',
  green: 'bg-stage-green', red: 'bg-stage-red', violet: 'bg-stage-violet',
};
const COLORS = Object.keys(COLOR_DOT);
const STATUSES: readonly StaffTaskStatus[] = ['OPEN', 'IN_PROGRESS', 'WAITING', 'DONE'];

export type StageManagerActions = {
  create: (payload: CreateStagePayload) => Promise<StageWriteResult>;
  update: (id: string, payload: UpdateStagePayload) => Promise<StageWriteResult>;
  reorder: (scope: 'TASKS', orderedIds: string[]) => Promise<StageWriteResult>;
  archive: (id: string, destinationStageId: string) => Promise<StageWriteResult>;
};

export function StageManager({ actions, locale, stages }: { actions: StageManagerActions; locale: Locale; stages: BoardStage[] }) {
  const t = taskBoardText[locale].manage;
  const dir = staffShellText[locale].dir;
  const [pending, startTransition] = useTransition();
  const [archiving, setArchiving] = useState<string | null>(null);

  const run = (work: () => Promise<StageWriteResult>, successMessage: string) => {
    startTransition(async () => {
      const result = await work();
      if (result.status === 'success') { toast.success(successMessage); return; }
      if (result.status === 'conflict') toast.error(t.toasts.conflict);
      else if (result.status === 'denied') toast.error(t.toasts.denied);
      else toast.error(t.toasts.failed);
    });
  };

  const move = (index: number, delta: number) => {
    const orderedIds = stages.map((stage) => stage.id);
    const target = index + delta;
    if (target < 0 || target >= orderedIds.length) return;
    [orderedIds[index], orderedIds[target]] = [orderedIds[target]!, orderedIds[index]!];
    run(() => actions.reorder('TASKS', orderedIds), t.toasts.reordered);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button className="min-h-11 gap-2" type="button" variant="outline">
          <Settings2 aria-hidden="true" className="size-4" />
          {t.open}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md" dir={dir} side={dir === 'rtl' ? 'left' : 'right'}>
        <SheetHeader>
          <SheetTitle>{t.title}</SheetTitle>
          <SheetDescription>{t.help}</SheetDescription>
        </SheetHeader>
        <ul className="mt-4 grid gap-3">
          {stages.map((stage, index) => (
            <li className="grid gap-2 rounded-lg border border-line-subtle bg-surface p-3" key={stage.id}>
              <StageRow
                archiving={archiving === stage.id}
                disabled={pending}
                index={index}
                last={index === stages.length - 1}
                locale={locale}
                onArchive={(destinationStageId) => { setArchiving(null); run(() => actions.archive(stage.id, destinationStageId), t.toasts.archived); }}
                onArchiveToggle={(open) => setArchiving(open ? stage.id : null)}
                onMove={(delta) => move(index, delta)}
                onSave={(payload) => run(() => actions.update(stage.id, payload), t.toasts.saved)}
                others={stages.filter((candidate) => candidate.id !== stage.id)}
                stage={stage}
              />
            </li>
          ))}
        </ul>
        <AddStageForm disabled={pending} locale={locale} onAdd={(payload) => run(() => actions.create(payload), t.toasts.added)} />
      </SheetContent>
    </Sheet>
  );
}

function StageRow({ archiving, disabled, index, last, locale, onArchive, onArchiveToggle, onMove, onSave, others, stage }: {
  archiving: boolean;
  disabled: boolean;
  index: number;
  last: boolean;
  locale: Locale;
  onArchive: (destinationStageId: string) => void;
  onArchiveToggle: (open: boolean) => void;
  onMove: (delta: number) => void;
  onSave: (payload: UpdateStagePayload) => void;
  others: BoardStage[];
  stage: BoardStage;
}) {
  const t = taskBoardText[locale].manage;
  const [nameEn, setNameEn] = useState(stage.nameEn);
  const [nameAr, setNameAr] = useState(stage.nameAr);
  const [color, setColor] = useState(stage.color);
  const [destination, setDestination] = useState(others[0]?.id ?? '');
  const dirty = nameEn !== stage.nameEn || nameAr !== stage.nameAr || color !== stage.color;

  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2 text-sm font-bold">
          <span aria-hidden="true" className={`size-2.5 shrink-0 rounded-full ${COLOR_DOT[color] ?? COLOR_DOT.slate}`} />
          <span className="truncate">{locale === 'ar' ? stage.nameAr : stage.nameEn}</span>
        </span>
        <span className="flex shrink-0 items-center gap-1">
          <Button aria-label={t.moveUp} className="size-9" disabled={disabled || index === 0} onClick={() => onMove(-1)} size="icon" type="button" variant="ghost"><ChevronUp aria-hidden="true" className="size-4" /></Button>
          <Button aria-label={t.moveDown} className="size-9" disabled={disabled || last} onClick={() => onMove(1)} size="icon" type="button" variant="ghost"><ChevronDown aria-hidden="true" className="size-4" /></Button>
          <Button aria-label={`${t.archive}: ${stage.nameEn}`} className="size-9" disabled={disabled || others.length === 0} onClick={() => onArchiveToggle(!archiving)} size="icon" type="button" variant="ghost"><ArchiveIcon aria-hidden="true" className="size-4" /></Button>
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="grid gap-1 text-xs font-semibold text-content-muted">{t.nameEn}
          <Input className="min-h-10" dir="ltr" onChange={(event) => setNameEn(event.target.value)} value={nameEn} />
        </label>
        <label className="grid gap-1 text-xs font-semibold text-content-muted">{t.nameAr}
          <Input className="min-h-10" dir="rtl" onChange={(event) => setNameAr(event.target.value)} value={nameAr} />
        </label>
      </div>
      <ColorPicker color={color} label={t.color} labels={t.colors} onChange={setColor} />
      {dirty ? (
        <Button className="min-h-10 justify-self-end" disabled={disabled || !nameEn.trim() || !nameAr.trim()} onClick={() => onSave({ nameEn: nameEn.trim(), nameAr: nameAr.trim(), color })} type="button">{t.save}</Button>
      ) : null}
      {archiving ? (
        <div className="grid gap-2 rounded-md border border-status-warning-border bg-status-warning-bg p-2">
          <Label className="text-xs font-semibold" htmlFor={`destination-${stage.id}`}>{t.destination}</Label>
          <FormSelect className="min-h-10" id={`destination-${stage.id}`} onValueChange={setDestination} options={others.map((candidate) => ({ label: locale === 'ar' ? candidate.nameAr : candidate.nameEn, value: candidate.id }))} value={destination} />
          <div className="flex justify-end gap-2">
            <Button className="min-h-10" onClick={() => onArchiveToggle(false)} type="button" variant="outline">{t.cancelArchive}</Button>
            <Button className="min-h-10" disabled={disabled || !destination} onClick={() => onArchive(destination)} type="button" variant="destructive">{t.confirmArchive}</Button>
          </div>
        </div>
      ) : null}
    </>
  );
}

function AddStageForm({ disabled, locale, onAdd }: { disabled: boolean; locale: Locale; onAdd: (payload: CreateStagePayload) => void }) {
  const t = taskBoardText[locale].manage;
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [color, setColor] = useState('blue');
  const [mapping, setMapping] = useState('');

  const submit = () => {
    const code = `TASKS_${nameEn.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '')}_${Date.now().toString(36).toUpperCase()}`;
    onAdd({
      code,
      scope: 'TASKS',
      nameEn: nameEn.trim(),
      nameAr: nameAr.trim(),
      color,
      ...(mapping ? { mappedTaskStatus: mapping as StaffTaskStatus } : {}),
    });
    setNameEn(''); setNameAr(''); setMapping('');
  };

  return (
    <section aria-label={t.addTitle} className="mt-5 grid gap-2 border-t border-line-subtle pt-4">
      <h3 className="flex items-center gap-2 text-sm font-bold"><Plus aria-hidden="true" className="size-4" />{t.addTitle}</h3>
      <div className="grid grid-cols-2 gap-2">
        <label className="grid gap-1 text-xs font-semibold text-content-muted">{t.nameEn}
          <Input className="min-h-10" dir="ltr" onChange={(event) => setNameEn(event.target.value)} value={nameEn} />
        </label>
        <label className="grid gap-1 text-xs font-semibold text-content-muted">{t.nameAr}
          <Input className="min-h-10" dir="rtl" onChange={(event) => setNameAr(event.target.value)} value={nameAr} />
        </label>
      </div>
      <ColorPicker color={color} label={t.color} labels={t.colors} onChange={setColor} />
      <label className="grid gap-1 text-xs font-semibold text-content-muted">{t.mapping}
        <FormSelect className="min-h-10" onValueChange={setMapping} options={STATUSES.map((status) => ({ label: t.statuses[status], value: status }))} placeholder={t.mappingNone} value={mapping} />
      </label>
      <Button className="min-h-11 justify-self-end" disabled={disabled || !nameEn.trim() || !nameAr.trim()} onClick={submit} type="button">{t.add}</Button>
    </section>
  );
}

function ColorPicker({ color, label, labels, onChange }: { color: string; label: string; labels: Record<string, string>; onChange: (color: string) => void }) {
  return (
    <fieldset className="grid gap-1">
      <legend className="text-xs font-semibold text-content-muted">{label}</legend>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={label}>
        {COLORS.map((candidate) => (
          <button
            aria-checked={color === candidate}
            aria-label={labels[candidate] ?? candidate}
            className={`grid size-9 place-items-center rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-brand ${color === candidate ? 'border-brand ring-1 ring-brand' : 'border-line-subtle'}`}
            key={candidate}
            onClick={() => onChange(candidate)}
            role="radio"
            type="button"
          >
            <span aria-hidden="true" className={`size-4 rounded-full ${COLOR_DOT[candidate]}`} />
          </button>
        ))}
      </div>
    </fieldset>
  );
}

'use client';

import { Building2, Check } from 'lucide-react';
import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatBoardText, type TaskBoardText } from '../../i18n/staff-task-board';
import { staffShellText, type Locale } from '../../i18n/staff-shell';
import type { BoardCard, BoardDepartment } from '../../lib/staff-board-api';

// B3 — department assignment control on a board card. The server owns the
// authority: the PATCH is validated + audited by the API; this popover only
// picks from the reference list the board response provided.

export type AssignDepartmentHandler = (taskId: string, departmentId: string | null, departmentName: string) => void;

export function departmentLabel(card: Pick<BoardCard, 'departmentName' | 'departmentNameAr'>, locale: Locale): string | null {
  const name = locale === 'ar' ? card.departmentNameAr ?? card.departmentName : card.departmentName ?? card.departmentNameAr;
  return name?.trim() || null;
}

// Read-only badge for contexts without the popover (e.g. the drag overlay).
export function CardDepartmentBadge({ card, locale }: { card: BoardCard; locale: Locale }) {
  const label = departmentLabel(card, locale);
  if (!label) return null;
  return (
    <span className="inline-flex max-w-full items-center gap-1 rounded-md border border-line-subtle bg-surface-raised px-1.5 py-0.5 text-[11px] font-semibold text-content-muted">
      <Building2 aria-hidden="true" className="size-3 shrink-0" />
      <span className="truncate">{label}</span>
    </span>
  );
}

export function CardDepartmentControl({ card, departments, locale, onAssign, t }: {
  card: BoardCard;
  departments: BoardDepartment[];
  locale: Locale;
  onAssign: AssignDepartmentHandler;
  t: TaskBoardText;
}) {
  const [open, setOpen] = useState(false);
  const label = departmentLabel(card, locale) ?? t.assign.label;
  const pick = (departmentId: string | null, name: string) => {
    setOpen(false);
    if (departmentId !== card.assignedDepartmentId) onAssign(card.id, departmentId, name);
  };

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <button
          aria-label={formatBoardText(t.assign.trigger, { title: card.title })}
          className="inline-flex max-w-full items-center gap-1 rounded-md border border-line-subtle bg-surface-raised px-1.5 py-0.5 text-[11px] font-semibold text-content-muted transition-colors hover:border-line-strong hover:text-content-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          onKeyDown={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
          type="button"
        >
          <Building2 aria-hidden="true" className="size-3 shrink-0" />
          <span className="truncate">{label}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-1.5" dir={staffShellText[locale].dir}>
        <p className="px-2 pb-1.5 pt-1 text-xs text-content-muted">{t.assign.help}</p>
        <div aria-label={t.assign.label} className="grid gap-0.5" role="group">
          <DepartmentOption label={t.assign.none} onPick={() => pick(null, '')} selected={card.assignedDepartmentId === null} />
          {departments.map((department) => {
            const name = locale === 'ar' ? department.nameAr : department.nameEn;
            return (
              <DepartmentOption
                key={department.id}
                label={name}
                onPick={() => pick(department.id, name)}
                selected={card.assignedDepartmentId === department.id}
              />
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function DepartmentOption({ label, onPick, selected }: { label: string; onPick: () => void; selected: boolean }) {
  return (
    <button
      aria-pressed={selected}
      className={`flex min-h-9 items-center justify-between gap-2 rounded-md px-2 text-start text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand ${selected ? 'bg-surface-sunken font-semibold text-content-strong' : 'text-content-muted hover:bg-surface-sunken hover:text-content-strong'}`}
      onClick={onPick}
      type="button"
    >
      <span className="truncate">{label}</span>
      {selected ? <Check aria-hidden="true" className="size-4 shrink-0 text-brand" /> : null}
    </button>
  );
}

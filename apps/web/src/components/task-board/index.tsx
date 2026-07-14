'use client';

import {
  DndContext, DragOverlay, KeyboardSensor, PointerSensor, TouchSensor, closestCorners, useSensor, useSensors,
  type Announcements, type DragEndEvent, type DragOverEvent, type DragStartEvent, type UniqueIdentifier,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import React, { useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from 'react';
import { toast, Toaster } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { staffShellText, type Locale } from '../../i18n/staff-shell';
import { formatBoardCount, formatBoardText, taskBoardText } from '../../i18n/staff-task-board';
import type { BoardCard, BoardStage, MoveTaskCardPayload, MoveTaskCardResult, TaskBoard } from '../../lib/staff-board-api';
import { BoardCardView, SortableBoardCard } from './board-card';
import { BoardColumnShell } from './board-column';

export type MoveTaskCardAction = (taskId: string, payload: MoveTaskCardPayload) => Promise<MoveTaskCardResult>;
type Columns = Record<string, BoardCard[]>;
type PendingNote = { taskId: string; stageId: string; boardPosition: number; stageName: string; snapshot: Columns };

export function TaskBoardScreen({ board, locale, moveAction, stageManager, state }: {
  board: TaskBoard | null;
  locale: Locale;
  moveAction: MoveTaskCardAction;
  stageManager?: ReactNode;
  state?: 'denied' | 'error' | undefined;
}) {
  const t = taskBoardText[locale];
  const shell = staffShellText[locale];
  const stages = useMemo(() => board?.stages ?? [], [board]);
  const [columns, setColumns] = useState<Columns>(() => columnsFrom(board));
  const [view, setView] = useState<'board' | 'list'>('board');
  const [activeCard, setActiveCard] = useState<BoardCard | null>(null);
  const [pendingNote, setPendingNote] = useState<PendingNote | null>(null);
  const [, startTransition] = useTransition();
  const dragSnapshot = useRef<Columns | null>(null);

  useEffect(() => { setColumns(columnsFrom(board)); }, [board]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  if (state || !board) {
    return <BoardMessage text={state === 'denied' ? t.states.denied : t.states.error} title={t.title} dir={shell.dir} />;
  }
  if (stages.length === 0 || Object.values(columns).every((cards) => cards.length === 0)) {
    return <BoardMessage text={t.states.empty} title={t.title} dir={shell.dir} stages={stages} columns={columns} locale={locale} />;
  }

  const stageName = (stage: BoardStage) => (locale === 'ar' ? stage.nameAr : stage.nameEn);
  const findColumn = (id: UniqueIdentifier): string | null => {
    if (typeof id !== 'string') return null;
    if (columns[id]) return id;
    return Object.keys(columns).find((stageId) => columns[stageId]!.some((card) => card.id === id)) ?? null;
  };
  const announcementStage = (over: UniqueIdentifier | undefined): string => {
    const columnId = over === undefined ? null : findColumn(over);
    const stage = stages.find((candidate) => candidate.id === columnId);
    return stage ? stageName(stage) : '';
  };
  const announcements: Announcements = {
    onDragStart: ({ active }) => formatBoardText(t.a11y.pickedUp, { title: cardTitle(columns, active.id) }),
    onDragOver: ({ active, over }) => formatBoardText(t.a11y.movedOver, { title: cardTitle(columns, active.id), stage: announcementStage(over?.id) }),
    onDragEnd: ({ active, over }) => formatBoardText(t.a11y.dropped, { title: cardTitle(columns, active.id), stage: announcementStage(over?.id) }),
    onDragCancel: ({ active }) => formatBoardText(t.a11y.canceled, { title: cardTitle(columns, active.id) }),
  };

  const commitMove = (taskId: string, stageId: string, boardPosition: number, snapshot: Columns, statusNote?: string) => {
    startTransition(async () => {
      const result = await moveAction(taskId, { stageId, boardPosition, ...(statusNote ? { statusNote } : {}) });
      const stage = stages.find((candidate) => candidate.id === stageId);
      if (result.status === 'success') {
        toast.success(formatBoardText(t.toasts.moved, { stage: stage ? stageName(stage) : '' }));
        return;
      }
      if (result.status === 'invalid' && result.fields.includes('statusNote') && stage) {
        setPendingNote({ taskId, stageId, boardPosition, stageName: stageName(stage), snapshot });
        return;
      }
      setColumns(snapshot);
      if (result.status === 'invalid' && result.fields.some((field) => field.startsWith('nextAction'))) toast.error(t.toasts.nextActionRequired);
      else if (result.status === 'denied') toast.error(t.toasts.moveDenied);
      else if (result.status === 'not_found') toast.error(t.toasts.stageMissing);
      else toast.error(t.toasts.moveFailed);
    });
  };

  const onDragStart = ({ active }: DragStartEvent) => {
    dragSnapshot.current = columns;
    const columnId = findColumn(active.id);
    setActiveCard(columnId ? columns[columnId]!.find((card) => card.id === active.id) ?? null : null);
  };
  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return;
    const from = findColumn(active.id);
    const to = findColumn(over.id);
    if (!from || !to || from === to) return;
    setColumns((current) => {
      const moving = current[from]!.find((card) => card.id === active.id);
      if (!moving) return current;
      const overIndex = current[to]!.findIndex((card) => card.id === over.id);
      const insertAt = overIndex >= 0 ? overIndex : current[to]!.length;
      return {
        ...current,
        [from]: current[from]!.filter((card) => card.id !== active.id),
        [to]: [...current[to]!.slice(0, insertAt), { ...moving, stageId: to }, ...current[to]!.slice(insertAt)],
      };
    });
  };
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    const snapshot = dragSnapshot.current ?? columns;
    dragSnapshot.current = null;
    setActiveCard(null);
    const to = over ? findColumn(over.id) : null;
    if (!to) { setColumns(snapshot); return; }
    const fromIndex = columns[to]!.findIndex((card) => card.id === active.id);
    const overIndex = over && over.id !== active.id ? columns[to]!.findIndex((card) => card.id === over.id) : fromIndex;
    const toIndex = overIndex >= 0 ? overIndex : Math.max(columns[to]!.length - 1, 0);
    const next = { ...columns, [to]: arrayMove(columns[to]!, fromIndex, toIndex) };
    setColumns(next);
    const sourceColumn = Object.keys(snapshot).find((stageId) => snapshot[stageId]!.some((card) => card.id === active.id));
    if (sourceColumn === to && sameOrder(snapshot[to]!, next[to]!)) return;
    commitMove(String(active.id), to, toIndex, snapshot);
  };

  return (
    <section aria-label={t.title} className="grid content-start gap-4" dir={shell.dir}>
      <Toaster dir={shell.dir === 'rtl' ? 'rtl' : 'ltr'} position="bottom-center" richColors />
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-content-strong">{t.title}</h2>
          <p className="mt-1 text-sm text-content-muted">{t.subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
        {stageManager}
        <div aria-label={t.view.label} className="flex rounded-lg border border-line-subtle bg-surface p-0.5 lg:hidden" role="group">
          {(['board', 'list'] as const).map((mode) => (
            <button aria-pressed={view === mode} className={`min-h-11 min-w-16 rounded-md px-3 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-brand ${view === mode ? 'bg-brand text-brand-foreground shadow-sm' : 'text-content-muted'}`} key={mode} onClick={() => setView(mode)} type="button">
              {t.view[mode]}
            </button>
          ))}
        </div>
        </div>
      </header>
      <DndContext accessibility={{ announcements, screenReaderInstructions: { draggable: t.a11y.instructions } }} collisionDetection={closestCorners} onDragCancel={() => { if (dragSnapshot.current) setColumns(dragSnapshot.current); dragSnapshot.current = null; setActiveCard(null); }} onDragEnd={onDragEnd} onDragOver={onDragOver} onDragStart={onDragStart} sensors={sensors}>
        <ol aria-label={t.boardLabel} className={view === 'list' ? 'grid gap-4 lg:flex lg:snap-x lg:snap-mandatory lg:gap-4 lg:overflow-x-auto lg:pb-3' : 'flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3'}>
          {stages.map((stage) => {
            const cards = columns[stage.id] ?? [];
            return (
              <BoardColumnShell cards={cards} key={stage.id} label={formatBoardText(t.columnLabel, { name: stageName(stage), count: cards.length })} layout={view} stage={stage} count={formatBoardCount(cards.length, t.cardCount)} emptyText={t.columnEmpty} title={stageName(stage)}>
                <SortableContext items={cards.map((card) => card.id)} strategy={verticalListSortingStrategy}>
                  {cards.map((card) => <SortableBoardCard card={card} key={card.id} locale={locale} t={t} />)}
                </SortableContext>
              </BoardColumnShell>
            );
          })}
        </ol>
        <DragOverlay>{activeCard ? <BoardCardView card={activeCard} dragging locale={locale} t={t} /> : null}</DragOverlay>
      </DndContext>
      <MoveNoteDialog locale={locale} pending={pendingNote} onCancel={() => { if (pendingNote) setColumns(pendingNote.snapshot); setPendingNote(null); }} onConfirm={(note) => { if (!pendingNote) return; const { taskId, stageId, boardPosition, snapshot } = pendingNote; setPendingNote(null); commitMove(taskId, stageId, boardPosition, snapshot, note); }} />
    </section>
  );
}

function MoveNoteDialog({ locale, onCancel, onConfirm, pending }: { locale: Locale; onCancel: () => void; onConfirm: (note: string) => void; pending: PendingNote | null }) {
  const t = taskBoardText[locale];
  const [note, setNote] = useState('');
  useEffect(() => { if (pending) setNote(''); }, [pending]);
  return (
    <Dialog onOpenChange={(open) => { if (!open) onCancel(); }} open={pending !== null}>
      <DialogContent dir={staffShellText[locale].dir}>
        <DialogHeader>
          <DialogTitle>{t.noteDialog.title}</DialogTitle>
          <DialogDescription>{pending ? formatBoardText(t.noteDialog.help, { stage: pending.stageName }) : null}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="board-move-note">{t.noteDialog.noteLabel}</Label>
          <Textarea id="board-move-note" onChange={(event) => setNote(event.target.value)} placeholder={t.noteDialog.notePlaceholder} rows={3} value={note} />
        </div>
        <DialogFooter className="gap-2">
          <Button onClick={onCancel} type="button" variant="outline">{t.noteDialog.cancel}</Button>
          <Button disabled={!note.trim()} onClick={() => onConfirm(note.trim())} type="button">{t.noteDialog.confirm}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BoardMessage({ columns, dir, locale, stages, text, title }: { columns?: Columns; dir: string; locale?: Locale; stages?: BoardStage[]; text: string; title: string }) {
  return (
    <section aria-label={title} className="grid content-start gap-4" dir={dir}>
      <header><h2 className="text-lg font-bold tracking-tight text-content-strong">{title}</h2></header>
      <p className="rounded-lg border border-line-subtle bg-surface-raised p-4 text-sm text-content-muted" role="status">{text}</p>
      {stages && columns && locale ? (
        <ol className="flex gap-4 overflow-x-auto pb-3">
          {stages.map((stage) => (
            <li className="w-72 shrink-0 rounded-xl border border-board-column-border bg-board-column p-3" key={stage.id}>
              <p className="text-sm font-bold text-content-strong">{locale === 'ar' ? stage.nameAr : stage.nameEn}</p>
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}

function columnsFrom(board: TaskBoard | null): Columns {
  const result: Columns = {};
  for (const stage of board?.stages ?? []) result[stage.id] = [];
  for (const column of board?.columns ?? []) result[column.stageId] = [...column.cards];
  return result;
}

function cardTitle(columns: Columns, id: UniqueIdentifier): string {
  for (const cards of Object.values(columns)) {
    const card = cards.find((candidate) => candidate.id === id);
    if (card) return card.title;
  }
  return '';
}

function sameOrder(before: BoardCard[], after: BoardCard[]): boolean {
  return before.length === after.length && before.every((card, index) => card.id === after[index]!.id);
}

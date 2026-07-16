'use client';

import {
  DndContext, DragOverlay, KeyboardSensor, PointerSensor, TouchSensor, closestCorners, useSensor, useSensors,
  type Announcements, type DragEndEvent, type DragStartEvent, type UniqueIdentifier,
} from '@dnd-kit/core';
import React, { useMemo, useState } from 'react';
import { toast, Toaster } from 'sonner';
import { complaintBoardText } from '../../i18n/staff-complaint-board';
import { formatBoardText } from '../../i18n/staff-task-board';
import { staffShellText, type Locale } from '../../i18n/staff-shell';
import type { AssignableStaff } from '../../lib/staff-assignable-staff-api';
import type { ComplaintFormOptions } from '../../lib/staff-complaint-form-options-api';
import type { ComplaintBoard, ComplaintBoardCard, ComplaintBoardStage, ComplaintTransitionPayload, TransitionComplaintResult } from '../../lib/staff-complaint-board-api';
import { ComplaintCardView, DraggableComplaintCard } from './board-card';
import { ComplaintColumnShell } from './board-column';
import { TransitionDialog, type PendingDrop } from './transition-dialog';

export type TransitionComplaintAction = (complaintId: string, payload: ComplaintTransitionPayload) => Promise<TransitionComplaintResult>;

export function ComplaintBoardScreen({ board, locale, options, staff, state, transitionAction }: {
  board: ComplaintBoard | null;
  locale: Locale;
  options?: ComplaintFormOptions | null | undefined;
  staff?: AssignableStaff[] | null | undefined;
  state?: 'denied' | 'error' | undefined;
  transitionAction: TransitionComplaintAction;
}) {
  const t = complaintBoardText[locale];
  const shell = staffShellText[locale];
  const stages = board?.stages ?? [];
  const cardsById = useMemo(() => cardIndex(board), [board]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingDrop | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    // Default keyboard coordinate getter (not the sortable one): this board has no
    // SortableContext, so arrow keys move the drag across droppable columns.
    useSensor(KeyboardSensor),
  );

  if (state || !board) {
    return <BoardMessage dir={shell.dir} text={state === 'denied' ? t.states.denied : t.states.error} title={t.title} />;
  }
  if (stages.length === 0 || cardsById.size === 0) {
    return <BoardMessage columns={board.columns} dir={shell.dir} locale={locale} stages={stages} text={t.states.empty} title={t.title} />;
  }

  const stageName = (stage: ComplaintBoardStage) => (locale === 'ar' ? stage.nameAr : stage.nameEn);
  const activeCard = activeId ? cardsById.get(activeId) ?? null : null;
  const legalStatuses = activeCard ? new Set(activeCard.allowedTransitions.map((transition) => transition.toStatus)) : null;
  const columnState = (stage: ComplaintBoardStage): { dimmed: boolean; disabled: boolean } => {
    if (!activeCard || !legalStatuses) return { dimmed: false, disabled: false };
    if (stage.id === activeCard.stageId) return { dimmed: false, disabled: true }; // same column: no-op
    const legal = stage.mappedComplaintStatus !== null && legalStatuses.has(stage.mappedComplaintStatus);
    return { dimmed: !legal, disabled: !legal };
  };

  const cardReference = (id: UniqueIdentifier): string => cardsById.get(String(id))?.referenceNumber ?? '';
  const overStageName = (over: UniqueIdentifier | undefined): string => {
    const stage = over === undefined ? undefined : stages.find((candidate) => candidate.id === String(over));
    return stage ? stageName(stage) : '';
  };
  const announcements: Announcements = {
    onDragStart: ({ active }) => formatBoardText(t.a11y.pickedUp, { reference: cardReference(active.id) }),
    onDragOver: ({ active, over }) => formatBoardText(t.a11y.movedOver, { reference: cardReference(active.id), stage: overStageName(over?.id) }),
    onDragEnd: ({ active, over }) => formatBoardText(t.a11y.dropped, { reference: cardReference(active.id), stage: overStageName(over?.id) }),
    onDragCancel: ({ active }) => formatBoardText(t.a11y.canceled, { reference: cardReference(active.id) }),
  };

  const onDragStart = ({ active }: DragStartEvent) => setActiveId(String(active.id));
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    const card = cardsById.get(String(active.id));
    setActiveId(null);
    if (!over || !card) return;
    const targetStage = stages.find((candidate) => candidate.id === String(over.id));
    if (!targetStage || targetStage.id === card.stageId) return; // dropped outside or back on its own column: no-op
    const transition = card.allowedTransitions.find((candidate) => candidate.toStatus === targetStage.mappedComplaintStatus);
    if (!transition) { toast.error(formatBoardText(t.toasts.illegal, { reference: card.referenceNumber })); return; }
    setPending({ card, stageName: stageName(targetStage), transition });
  };

  return (
    <section aria-label={t.title} className="grid content-start gap-4" dir={shell.dir}>
      <Toaster dir={shell.dir === 'rtl' ? 'rtl' : 'ltr'} position="bottom-center" richColors />
      <header>
        <h2 className="text-lg font-bold tracking-tight text-content-strong">{t.title}</h2>
        <p className="mt-1 text-sm text-content-muted">{t.subtitle}</p>
      </header>
      <DndContext accessibility={{ announcements, screenReaderInstructions: { draggable: t.a11y.instructions } }} collisionDetection={closestCorners} onDragCancel={() => setActiveId(null)} onDragEnd={onDragEnd} onDragStart={onDragStart} sensors={sensors}>
        <ol aria-label={t.boardLabel} className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3">
          {stages.map((stage) => {
            const cards = board.columns.find((column) => column.stageId === stage.id)?.cards ?? [];
            const { dimmed, disabled } = columnState(stage);
            return (
              <ComplaintColumnShell count={formatBoardCount(cards.length, t.ticketCount)} dimmed={dimmed} disabled={disabled} empty={cards.length === 0} emptyText={t.columnEmpty} key={stage.id} label={formatBoardText(t.columnLabel, { name: stageName(stage), count: cards.length })} stage={stage} title={stageName(stage)}>
                {cards.map((card) => <DraggableComplaintCard card={card} key={card.id} t={t} />)}
              </ComplaintColumnShell>
            );
          })}
        </ol>
        <DragOverlay>{activeCard ? <ComplaintCardView card={activeCard} dragging t={t} /> : null}</DragOverlay>
      </DndContext>
      <TransitionDialog
        locale={locale}
        onClose={() => setPending(null)}
        onSuccess={(name) => { setPending(null); toast.success(formatBoardText(t.toasts.transitioned, { reference: pending?.card.referenceNumber ?? '', stage: name })); }}
        options={options}
        pending={pending}
        staff={staff}
        submit={transitionAction}
      />
    </section>
  );
}

function BoardMessage({ columns, dir, locale, stages, text, title }: { columns?: ComplaintBoard['columns']; dir: string; locale?: Locale; stages?: ComplaintBoardStage[]; text: string; title: string }) {
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

function cardIndex(board: ComplaintBoard | null): Map<string, ComplaintBoardCard> {
  const index = new Map<string, ComplaintBoardCard>();
  for (const column of board?.columns ?? []) for (const card of column.cards) index.set(card.id, card);
  return index;
}

function formatBoardCount(count: number, copy: { one: string; other: string }): string {
  return count === 1 ? copy.one : formatBoardText(copy.other, { count });
}

'use client';

import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, TouchSensor, closestCorners, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import React, { useId, useMemo, useState } from 'react';
import { Toaster, toast } from 'sonner';
import type { Locale } from '../../i18n/staff-shell';
import { complaintStatusLabel } from '../../i18n/domain-labels';
import type { ComplaintBoard, ComplaintBoardCard, ComplaintTransitionPayload, TransitionComplaintResult } from '../../lib/staff-complaint-board-api';
import { operationsBoardText } from '../../i18n/staff-operations-board';
import { OpsBoardControls, type BoardViewMode } from './ops-board-controls';
import { OpsColumn } from './ops-column';
import { OpsDetailDrawer } from './ops-detail-drawer';
import { OpsWorkCard } from './ops-work-card';

// ── Operations Board Main Screen ───────────────────────────────────────────
// The core operational workspace. Renders a horizontally scrolling board of columns.
// Currently implements the 'By Stage' view using existing backend data, but designed
// to toggle to 'By Department' once the new backend endpoint is wired.

export type TransitionComplaintAction = (complaintId: string, payload: ComplaintTransitionPayload) => Promise<TransitionComplaintResult>;

export function OperationsBoardScreen({ board, initialView = 'stage', locale, state }: {
  board: ComplaintBoard | null;
  initialView?: BoardViewMode;
  locale: Locale;
  state?: 'denied' | 'error';
}) {
  const t = operationsBoardText[locale];
  const [viewMode, setViewMode] = useState<BoardViewMode>(initialView);
  const [search, setSearch] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [detailCard, setDetailCard] = useState<ComplaintBoardCard | null>(null);
  const dndContextId = useId(); // Stable ID for hydration

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const cardsById = useMemo(() => {
    const map = new Map<string, ComplaintBoardCard>();
    for (const column of board?.columns ?? []) {
      for (const card of column.cards) map.set(card.id, card);
    }
    return map;
  }, [board]);

  if (state || !board) {
    return (
      <section aria-label={t.title} className="grid content-start gap-4">
        <header>
          <h2 className="text-lg font-bold tracking-tight text-content-strong">{t.title}</h2>
          <p className="mt-1 text-sm text-content-muted">{t.subtitle}</p>
        </header>
        <div className="rounded-lg border border-line-subtle bg-surface-raised p-4 text-sm text-content-muted">
          {state === 'denied' ? t.states.denied : t.states.error}
        </div>
      </section>
    );
  }

  // Temporary: In 'department' view without backend support, we just show a placeholder
  // or we could client-side group. For Phase 1 we will just render the stages since the
  // plan calls for backend support for departments.
  const stages = board.stages;

  const activeCard = activeId ? cardsById.get(activeId) ?? null : null;
  const legalStatuses = activeCard ? new Set(activeCard.allowedTransitions.map((tx) => tx.toStatus)) : null;

  // Filter cards by search term
  const filterCards = (cards: ComplaintBoardCard[]) => {
    if (!search.trim()) return cards;
    const lower = search.toLowerCase();
    return cards.filter(c =>
      c.referenceNumber.toLowerCase().includes(lower) ||
      c.subject.toLowerCase().includes(lower) ||
      c.ownerName?.toLowerCase().includes(lower)
    );
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const card = cardsById.get(String(active.id));
    const targetStage = stages.find((s) => s.id === String(over.id));

    if (!card || !targetStage || targetStage.id === card.stageId) return;

    if (viewMode !== 'stage') {
      toast.info(`Ready to assign ${card.referenceNumber} to ${targetStage.nameEn}`);
      return;
    }

    const transition = card.allowedTransitions.find((tx) => tx.toStatus === targetStage.mappedComplaintStatus);
    if (!transition) {
      toast.error(t.toasts.illegal.replace('{reference}', card.referenceNumber));
      return;
    }

    // In a real implementation, this would open a transition dialog like the old board.
    // For Phase 1 layout validation, we just log/toast.
    toast.info(`Ready to transition ${card.referenceNumber} to ${locale === 'ar' ? targetStage.nameAr : targetStage.nameEn}`);
  };

  const handleViewChange = (mode: BoardViewMode) => {
    if (mode === viewMode) return;
    setViewMode(mode);
    window.location.href = `/complaints/operations?view=${mode}&locale=${locale}`;
  };

  return (
    <section aria-label={t.title} className="flex min-w-0 flex-col gap-4 overflow-hidden h-full">
      <Toaster dir={locale === 'ar' ? 'rtl' : 'ltr'} position="bottom-center" richColors />

      <header className="shrink-0 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-content-strong">{t.title}</h2>
          <p className="mt-1 text-sm text-content-muted">{t.subtitle}</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 rounded-lg border border-line-subtle bg-surface px-3 py-2 text-xs text-content-muted shadow-sm" aria-label={t.legendTitle} title={t.legendTitle}>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-1.5 rounded-sm bg-status-success" />
            <span>{t.legendOnTime}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-1.5 rounded-sm bg-status-warning" />
            <span>{t.legendWarning}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-1.5 rounded-sm bg-status-error" />
            <span>{t.legendLate}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-1.5 rounded-sm bg-purple-500" />
            <span>{t.legendDoneLate}</span>
          </div>
        </div>
      </header>

      <OpsBoardControls
        createHref={`/complaints/new?locale=${locale}`}
        locale={locale}
        onSearchChange={setSearch}
        onViewChange={handleViewChange}
        search={search}
        t={t}
        view={viewMode}
      />

      <DndContext
        collisionDetection={closestCorners}
        id={dndContextId}
        onDragCancel={() => setActiveId(null)}
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
        sensors={sensors}
      >
        {/* Horizontal scroll container for the board columns */}
        <div className="w-full min-w-0 max-w-full rounded-2xl border border-line-subtle bg-surface-canvas/60 p-4 shadow-sm flex flex-col overflow-hidden">
          <div className="flex-1 overflow-x-auto min-w-0 max-w-full pb-4">
            <ol className="flex h-full items-start gap-4" aria-label={t.boardLabel}>
            {stages.map((stage) => {
              const columnCards = board.columns.find((c) => c.stageId === stage.id)?.cards ?? [];
              const filteredCards = filterCards(columnCards);
              const isLegalDrop = activeCard && legalStatuses && stage.mappedComplaintStatus
                ? legalStatuses.has(stage.mappedComplaintStatus)
                : false;
              const disabled = !!activeCard && !isLegalDrop && activeCard.stageId !== stage.id;
              const dimmed = !!activeCard && !isLegalDrop && activeCard.stageId !== stage.id;

              const groupedCards: Array<{ groupId: string | null; groupName: string | null; cards: ComplaintBoardCard[] }> = [];
              if (viewMode !== 'stage') {
                const map = new Map<string, ComplaintBoardCard[]>();
                for (const card of filteredCards) {
                  const id = card.status;
                  if (!map.has(id)) map.set(id, []);
                  map.get(id)!.push(card);
                }
                for (const [id, cards] of map.entries()) {
                  groupedCards.push({ groupId: id, groupName: complaintStatusLabel(locale, id), cards });
                }
              }

              return (
                <OpsColumn
                  cards={filteredCards}
                  dimmed={dimmed}
                  disabled={disabled}
                  key={stage.id}
                  stage={stage}
                  t={t}
                >
                  {viewMode !== 'stage' ? (
                    <div className="flex flex-col gap-4">
                      {groupedCards.map(group => (
                        <div key={group.groupId ?? 'general'} className="flex flex-col gap-2">
                          <h4 className="border-b border-line-subtle pb-1 text-xs font-semibold text-content-muted">{group.groupName}</h4>
                          <div className="flex flex-col gap-[var(--ops-card-gap)]">
                            {group.cards.map(card => (
                              <OpsWorkCard card={card} key={card.id} onClick={setDetailCard} t={t} />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    filteredCards.map((card) => (
                      <OpsWorkCard
                        card={card}
                        key={card.id}
                        onClick={setDetailCard}
                        t={t}
                      />
                    ))
                  )}
                </OpsColumn>
              );
            })}
          </ol>
          </div>
        </div>

        <DragOverlay>
          {activeCard ? (
            <div className="opacity-90 shadow-[var(--board-drag-shadow)]">
              <OpsWorkCard card={activeCard} t={t} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <OpsDetailDrawer
        card={detailCard}
        locale={locale}
        onClose={() => setDetailCard(null)}
        t={t}
      />
    </section>
  );
}

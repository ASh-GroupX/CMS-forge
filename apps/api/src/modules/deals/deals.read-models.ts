import type { AuditRecordInput } from '../../core/audit.service.js';
import type { DealActionHistoryDto, DealBoardItemDto } from './dto/deal-response.dto.js';
import type { DealAuditRow, DealRow } from './deals.repository.js';
import type { DealRecord } from './deals.service.js';

export function boardItem(deal: DealRow, now: Date, historyRows: DealAuditRow[], toResponse: (deal: DealRow) => DealRecord): DealBoardItemDto {
  const response = toResponse(deal);
  const history = historyRows.slice(0, 5).map(historyItem);
  return { ...response, delayAgeMinutes: Math.max(0, Math.floor((now.getTime() - deal.stageDueAt.getTime()) / 60_000)), lastAction: history[0] ?? null, history };
}

export function groupHistory(rows: DealAuditRow[]): Map<string, DealAuditRow[]> {
  const grouped = new Map<string, DealAuditRow[]>();
  for (const row of rows) if (row.targetId) grouped.set(row.targetId, [...(grouped.get(row.targetId) ?? []), row]);
  return grouped;
}

export function holderCounts(deals: DealBoardItemDto[]) {
  const grouped = new Map<string, { currentHolderId: string; currentHolderName: string | null; count: number }>();
  for (const deal of deals) {
    const holderId = deal.currentHolderId ?? deal.assignedDepartmentId ?? 'UNASSIGNED';
    const row = grouped.get(holderId) ?? { currentHolderId: holderId, currentHolderName: deal.currentHolderName ?? deal.assignedDepartmentName, count: 0 };
    row.count += 1;
    grouped.set(holderId, row);
  }
  return [...grouped.values()];
}

export function dealAudit(action: string, deal: DealRecord, context: { actorId?: string | null; correlationId?: string | null; ipAddress?: string | null; userAgent?: string | null }, metadata: Record<string, string>): AuditRecordInput {
  return {
    eventType: 'WORKFLOW', action, actorId: context.actorId ?? null,
    branchId: deal.branchId, targetType: 'deal', targetId: deal.id,
    correlationId: context.correlationId ?? null, ipAddress: context.ipAddress ?? null,
    userAgent: context.userAgent ?? null, metadata,
  };
}

function historyItem(row: DealAuditRow): DealActionHistoryDto {
  const metadata = row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata) ? row.metadata as Record<string, unknown> : {};
  return { id: row.id, action: row.action, actor: { id: row.actorId, name: row.actor?.nameEn ?? null }, createdAt: row.createdAt.toISOString(), updateNote: typeof metadata.updateNote === 'string' ? metadata.updateNote : null };
}

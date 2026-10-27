'use client';

import React from 'react';
import { ArrowDownLeft, ArrowRight, ArrowUpRight, Eye } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import type { TicketRecordRow } from '../../lib/staff-reports-analytics-api';

interface DepartmentTaskTableProps {
  tasks: TicketRecordRow[];
  emptyText: string;
  mode?: 'all' | 'inbound' | 'outbound';
  currentDeptId?: string;
  currentDeptName?: string;
  onInspect: (task: { id: string; refNumber: string; title: string; type: 'ticket' | 'complaint' }) => void;
  whoSentLabel: string;
  targetDeptLabel: string;
  assignedToLabel: string;
  flowLabel?: string;
  inboundBadgeLabel?: string;
  outboundBadgeLabel?: string;
}

export function DepartmentTaskTable({
  tasks,
  emptyText,
  mode = 'all',
  currentDeptId,
  currentDeptName,
  onInspect,
  whoSentLabel,
  targetDeptLabel,
  assignedToLabel,
  flowLabel = 'Workflow Routing Flow',
  inboundBadgeLabel = 'Incoming',
  outboundBadgeLabel = 'Outgoing',
}: DepartmentTaskTableProps) {
  return (
    <div className="relative w-full min-w-0 max-w-full overflow-x-auto rounded-xl border bg-card shadow-2xs">
      <table className="w-full text-start text-xs border-collapse">
        <thead>
          <tr className="border-b bg-muted/50 font-semibold text-muted-foreground">
            <th className="py-2.5 px-3 text-start">Ref #</th>
            <th className="py-2.5 px-3 text-start">Title</th>
            <th className="py-2.5 px-3 text-start min-w-[280px]">{flowLabel}</th>
            <th className="py-2.5 px-3 text-start">{whoSentLabel}</th>
            <th className="py-2.5 px-3 text-start">{mode === 'outbound' ? targetDeptLabel : assignedToLabel}</th>
            <th className="py-2.5 px-3 text-center">Status</th>
            <th className="py-2.5 px-3 text-end"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {tasks.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-8 text-center text-muted-foreground">
                {emptyText}
              </td>
            </tr>
          ) : (
            tasks.map((tk) => {
              const isOutboundTask =
                (currentDeptId && tk.creatingDepartmentId === currentDeptId) ||
                (currentDeptName && tk.creatingDepartmentName === currentDeptName);

              return (
                <tr
                  key={tk.id}
                  className="border-b hover:bg-muted/40 cursor-pointer transition-colors"
                  onClick={() => onInspect({ id: tk.id, refNumber: tk.referenceNumber, title: tk.title, type: 'ticket' })}
                >
                  <td className="py-2.5 px-3 font-mono text-xs font-bold text-primary whitespace-nowrap">
                    {tk.referenceNumber}
                  </td>
                  <td className="py-2.5 px-3 max-w-[200px] truncate font-medium text-foreground">
                    {tk.title}
                  </td>

                  {/* Dedicated Full Flow routing column */}
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1.5 flex-wrap text-2xs">
                      {isOutboundTask ? (
                        <Badge variant="outline" className="text-3xs font-bold gap-0.5 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900 bg-blue-50/60 dark:bg-blue-950/20 px-1 py-0">
                          <ArrowUpRight className="h-2.5 w-2.5" />
                          <span>{outboundBadgeLabel}</span>
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-3xs font-bold gap-0.5 text-primary border-primary/30 bg-primary/10 px-1 py-0">
                          <ArrowDownLeft className="h-2.5 w-2.5" />
                          <span>{inboundBadgeLabel}</span>
                        </Badge>
                      )}

                      <span className="font-semibold text-foreground">{tk.creatingDepartmentName}</span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0 rtl:rotate-180" />
                      <span className="font-semibold text-foreground">{tk.targetDepartmentName}</span>
                    </div>
                  </td>

                  <td className="py-2.5 px-3 text-foreground font-semibold whitespace-nowrap">
                    {tk.requestedByName}
                  </td>
                  <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap">
                    {mode === 'outbound' ? tk.targetDepartmentName : (tk.assignedEmployeeName || '—')}
                  </td>
                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                    <Badge variant="outline" className="text-3xs uppercase px-1.5 py-0 font-semibold">
                      {tk.status.replace(/_/g, ' ')}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-3 text-end">
                    <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" aria-label={`Inspect ${tk.referenceNumber}`}>
                      <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { Inbox, Users } from 'lucide-react';
import { toast } from 'sonner';
import { DepartmentKanbanColumn } from './department-kanban-column';
import { assignTicket, assignToTeamTicket } from '../../../lib/staff-internal-tickets-actions';
import type { Locale } from '../../../i18n/staff-shell';

interface DepartmentKanbanBoardProps {
  initialTickets: any[];
  team: any[];
  departments?: any[] | undefined;
  isAdmin: boolean;
  isManager: boolean;
  locale: Locale;
  principalUserId?: string | undefined;
}

export function DepartmentKanbanBoard({
  initialTickets,
  team,
  isAdmin,
  isManager,
  locale,
  principalUserId,
}: DepartmentKanbanBoardProps) {
  const [tickets, setTickets] = useState<any[]>(initialTickets);
  const [draggedTicket, setDraggedTicket] = useState<any | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);
  const isAr = locale === 'ar';
  const canDrag = isManager || isAdmin;

  const pendingInbox = tickets.filter(
    (t: any) => t.status === 'NEW' || t.status === 'TRANSFERRED'
  );

  const teamTasks = tickets.filter(
    (t: any) =>
      !t.assignedEmployeeId &&
      !['CLOSED', 'PENDING_APPROVAL', 'REJECTED', 'NEW', 'TRANSFERRED'].includes(t.status)
  );

  const visibleTeam = isAdmin || isManager
    ? team
    : team.filter((m: any) => m.id === principalUserId);

  const handleDragStart = (e: React.DragEvent, ticket: any) => {
    if (!canDrag) return;
    setDraggedTicket(ticket);
    e.dataTransfer.setData('text/plain', ticket.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedTicket(null);
    setDragOverTarget(null);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    if (!canDrag || !draggedTicket) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverTarget !== targetId) setDragOverTarget(targetId);
  };

  const handleDragLeave = (e: React.DragEvent, targetId: string) => {
    if (dragOverTarget === targetId) setDragOverTarget(null);
  };

  const handleDropOnTeam = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverTarget(null);
    if (!draggedTicket || !canDrag) return;

    if (!draggedTicket.assignedEmployeeId && draggedTicket.status !== 'NEW' && draggedTicket.status !== 'TRANSFERRED') {
      return;
    }

    const ticketId = draggedTicket.id;
    const prevTickets = [...tickets];

    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? { ...t, assignedEmployeeId: null, status: 'ASSIGNED', assignedEmployee: null }
          : t
      )
    );

    try {
      await assignToTeamTicket(ticketId);
      toast.success(isAr ? 'تم إسناد التذكرة إلى مهام الفريق' : 'Ticket assigned to team tasks');
    } catch {
      setTickets(prevTickets);
      toast.error(isAr ? 'فشل في إسناد التذكرة إلى الفريق' : 'Failed to assign ticket to team');
    } finally {
      setDraggedTicket(null);
    }
  };

  const handleDropOnEmployee = async (e: React.DragEvent, employee: any) => {
    e.preventDefault();
    setDragOverTarget(null);
    if (!draggedTicket || !canDrag) return;

    if (draggedTicket.assignedEmployeeId === employee.id) return;

    const ticketId = draggedTicket.id;
    const prevTickets = [...tickets];

    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? { ...t, assignedEmployeeId: employee.id, status: 'ASSIGNED', assignedEmployee: employee }
          : t
      )
    );

    const empName = isAr && employee.nameAr ? employee.nameAr : (employee.nameEn || employee.name || 'Staff');

    try {
      await assignTicket(ticketId, employee.id);
      toast.success(isAr ? `تم إسناد التذكرة إلى ${empName}` : `Ticket assigned to ${empName}`);
    } catch {
      setTickets(prevTickets);
      toast.error(isAr ? 'فشل في إسناد التذكرة' : 'Failed to assign ticket');
    } finally {
      setDraggedTicket(null);
    }
  };

  return (
    <div className="w-full min-w-0 max-w-full rounded-3xl border border-line-subtle bg-surface-canvas/60 p-4 shadow-sm flex flex-col overflow-hidden">
      <div className="flex gap-5 pb-4 items-start overflow-x-auto min-w-0 max-w-full">
        {/* 1. Pending Inbox Column */}
      {(isManager || isAdmin) && pendingInbox.length > 0 && (
        <DepartmentKanbanColumn
          id="inbox"
          isInbox
          title={isAr ? 'صندوق الوارد الجديد' : 'Pending Inbox'}
          icon={<Inbox className="size-4 text-brand" />}
          count={pendingInbox.length}
          subtitle={
            isAr
              ? 'تذاكر جديدة واردة إلى قسمك. اسحب أي تذكرة وضعها على عمود الموظف لإسنادها إليه مباشرة.'
              : 'New incoming tickets. Drag and drop onto any employee column to assign immediately.'
          }
          tickets={pendingInbox}
          emptyText={isAr ? 'لا توجد تذاكر واردة جديدة' : 'No incoming new tickets'}
          locale={locale}
          canDrag={canDrag}
          draggedTicketId={draggedTicket?.id}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        />
      )}

      {/* 2. Team Tasks Column */}
      <DepartmentKanbanColumn
        id="team"
        title={isAr ? 'مهام الفريق' : 'Team Tasks'}
        icon={<Users className="size-4 text-brand" />}
        count={teamTasks.length}
        tickets={teamTasks}
        isDropTarget={dragOverTarget === 'team'}
        dropText={isAr ? 'أفلت هنا لإسناد التذكرة للفريق' : 'Drop here to assign to Team'}
        emptyText={isAr ? 'لا توجد تذاكر جماعية غير مسندة.' : 'No unassigned team tickets.'}
        locale={locale}
        canDrag={canDrag}
        draggedTicketId={draggedTicket?.id}
        onDragOver={(e) => handleDragOver(e, 'team')}
        onDragLeave={(e) => handleDragLeave(e, 'team')}
        onDrop={handleDropOnTeam}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      />

      {/* 3. Employee Columns */}
      {visibleTeam.map((member: any) => {
        const memberTickets = tickets.filter(
          (t: any) => t.assignedEmployeeId === member.id && t.status !== 'CLOSED'
        );
        const memberName = isAr && (member.nameAr || member.name)
          ? member.nameAr || member.name
          : member.nameEn || member.name || (isAr ? 'موظف' : 'Staff');

        return (
          <DepartmentKanbanColumn
            key={member.id}
            id={member.id}
            title={memberName}
            icon={
              <div className="size-7 rounded-full bg-brand/10 flex items-center justify-center text-brand text-xs font-bold uppercase shrink-0">
                {String(memberName)[0]}
              </div>
            }
            count={memberTickets.length}
            tickets={memberTickets}
            isDropTarget={dragOverTarget === member.id}
            dropText={isAr ? `أفلت هنا للإسناد إلى ${memberName}` : `Drop here to assign to ${memberName}`}
            emptyText={isAr ? 'لا توجد مهام نشطة حالياً.' : 'No active tasks assigned.'}
            emptyHint={canDrag ? (isAr ? 'اسحب أي تذكرة هنا لإسنادها' : 'Drag any ticket here to assign') : undefined}
            locale={locale}
            canDrag={canDrag}
            draggedTicketId={draggedTicket?.id}
            onDragOver={(e) => handleDragOver(e, member.id)}
            onDragLeave={(e) => handleDragLeave(e, member.id)}
            onDrop={(e) => handleDropOnEmployee(e, member)}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          />
        );
      })}
      </div>
    </div>
  );
}

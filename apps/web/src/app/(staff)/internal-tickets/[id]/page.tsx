import React from 'react';
import { headers } from 'next/headers';
import { FileText, Send, Paperclip, MessageSquare, History, UserPlus, Clock, Star, AlertCircle, CheckCircle2, ChevronRight, User } from 'lucide-react';
import { getTicketDetails, getTicketOptions } from '../../../../lib/staff-internal-tickets-actions';
import { getStaffSessionPrincipal } from '../../../../lib/staff-session-api';
import { resolveLocale } from '../../../../i18n/staff-shell';
import { internalTicketStatusLabel } from '../../../../i18n/domain-labels';
import { TicketActionButtons } from './ticket-action-buttons';
import { TicketNoteForm } from './ticket-note-form';
import { TicketStopwatch } from '../ticket-stopwatch';

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const requestHeaders = await headers();
  const locale = resolveLocale(requestHeaders.get('x-cms-locale') ?? undefined);
  const isAr = locale === 'ar';
  const principal = await getStaffSessionPrincipal();
  
  const [ticket, options] = await Promise.all([
    getTicketDetails(id),
    getTicketOptions()
  ]);

  if (!ticket) {
    return <div className="p-8 text-center text-content-muted">Ticket not found</div>;
  }

  return (
    <div className="grid h-[calc(100vh-14rem)] min-h-[600px] grid-cols-1 md:grid-cols-[1fr_2fr] gap-6">
      
      {/* LEFT PANE: Working Notes */}
      <div className="flex flex-col rounded-2xl border border-line-subtle bg-surface shadow-sm overflow-hidden">
        <div className="border-b border-line-subtle bg-surface-canvas/50 px-4 py-3">
          <h3 className="font-semibold text-content-strong flex items-center gap-2">
            <FileText className="size-4 text-brand" />
            Working Notes
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-surface/30">
          {!ticket.notes || ticket.notes.length === 0 ? (
            <p className="text-sm text-content-muted text-center">No notes yet.</p>
          ) : (
            ticket.notes.map((note: any) => (
              <div key={note.id} className="flex gap-3">
                <div className="mt-1 grid size-8 shrink-0 place-items-center rounded-full bg-brand/10 text-brand font-bold text-xs">
                  {note.author?.nameEn?.[0] || 'U'}
                </div>
                <div className="flex flex-col flex-1 rounded-xl rounded-tl-sm bg-surface p-3 shadow-sm border border-line-subtle">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-sm font-bold text-content-strong">{note.author?.nameEn || 'Unknown User'}</span>
                    <span className="text-[10px] font-medium text-content-muted">{new Date(note.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                  </div>
                  <p className="text-sm text-content-strong whitespace-pre-wrap leading-relaxed">{note.content}</p>
                  {note.attachments && note.attachments.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-line-subtle flex flex-col gap-1.5">
                      <span className="text-xs font-bold text-content-muted">Attachments</span>
                      <div className="flex flex-wrap gap-2">
                        {note.attachments.map((att: any) => (
                          <a 
                            key={att.id} 
                            href={`/api/internal-tickets/${ticket.id}/notes/${note.id}/attachments/${att.id}/download?redirect=1`}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={att.fileName && att.fileName.includes('.') ? att.fileName : `${att.fileName || 'image'}.jpg`}
                            className="flex items-center gap-1.5 rounded-lg border border-line-subtle bg-surface-canvas px-2 py-1.5 hover:bg-surface-raised hover:border-brand/30 transition-colors"
                          >
                            <Paperclip className="size-3.5 text-content-muted" />
                            <span className="text-xs font-medium text-content-strong truncate max-w-[120px]" title={att.fileName}>{att.fileName}</span>
                            <span className="text-[10px] text-content-muted">({Math.round(att.sizeBytes / 1024)}KB)</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        <div className="border-t border-line-subtle p-3 bg-surface-canvas">
          <TicketNoteForm ticketId={id} />
        </div>
      </div>

      {/* CENTER & RIGHT: Ticket details & Activity */}
      <div className="flex flex-col gap-4 overflow-y-auto pr-2">
        
        {/* Ticket Header & Info */}
        <div className="flex flex-col gap-0 shrink-0 rounded-2xl border border-line-subtle bg-surface shadow-sm overflow-hidden">
          <div className="p-5">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2 flex-wrap">
                  <span className="rounded-md bg-brand/10 px-2.5 py-1 text-xs font-bold text-brand uppercase tracking-wider">
                    {internalTicketStatusLabel(locale, ticket.status)}
                  </span>
                  <span className="text-xs font-mono font-medium text-content-muted">{ticket.referenceNumber || ticket.id}</span>
                  <TicketStopwatch ticket={ticket} locale={locale} variant="badge" />
                </div>
                <h2 className="text-2xl font-black text-content-strong">{ticket.title}</h2>
              </div>
              <TicketActionButtons ticket={ticket} options={options} principal={principal} locale={locale} />
            </div>
            <div className="prose prose-sm max-w-none text-content-strong leading-relaxed bg-surface-canvas/30 p-4 rounded-xl border border-line-subtle">
              <p>{ticket.description || 'No description provided.'}</p>
            </div>
            {ticket.attachments && ticket.attachments.length > 0 && (
              <div className="mt-4 flex flex-col gap-2">
                <span className="text-sm font-bold text-content-strong flex items-center gap-1.5"><Paperclip className="size-4" /> Attachments</span>
                <div className="flex flex-wrap gap-2">
                  {ticket.attachments.map((att: any) => (
                    <a 
                      key={att.id} 
                      href={`/api/internal-tickets/${ticket.id}/attachments/${att.id}/download?redirect=1`}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={att.fileName && att.fileName.includes('.') ? att.fileName : `${att.fileName || 'image'}.jpg`}
                      className="flex items-center gap-2 rounded-xl border border-line-subtle bg-surface-canvas p-2 px-3 shadow-sm hover:bg-surface-raised hover:border-brand/30 transition-colors group"
                    >
                      <div className="grid size-8 place-items-center rounded-lg bg-brand/10 text-brand group-hover:bg-brand group-hover:text-white transition-colors">
                        <Paperclip className="size-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-content-strong truncate max-w-[200px]" title={att.fileName}>{att.fileName}</span>
                        <span className="text-[10px] font-medium text-content-muted">{Math.round(att.sizeBytes / 1024)} KB</span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {ticket.customFields && typeof ticket.customFields === 'object' && Object.keys(ticket.customFields).length > 0 && (
              <div className="mt-4 flex flex-col gap-2 rounded-xl border border-line-subtle bg-surface-canvas/40 p-4">
                <span className="text-xs font-bold text-content-muted uppercase tracking-wider">
                  {isAr ? 'بيانات إضافية مطلوبة من القسم' : 'Department Custom Fields'}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(ticket.customFields).map(([fieldId, val]) => {
                    const def = ticket.targetDepartment?.ticketCustomFields?.find(
                      (f: any) => f.id === fieldId || f.nameEn === fieldId
                    );
                    const label = isAr && def?.nameAr ? def.nameAr : (def?.nameEn || fieldId);
                    return (
                      <div key={fieldId} className="flex flex-col rounded-lg bg-surface p-2.5 border border-line-subtle">
                        <span className="text-[11px] font-bold text-content-muted">{label}</span>
                        <span className="text-sm font-semibold text-content-strong break-words">
                          {typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val ?? '-')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-x-4 gap-y-6 border-t border-line-subtle bg-surface-canvas/20 p-5">
            <div>
              <span className="text-[10px] text-content-muted font-bold uppercase tracking-wider block mb-1">From</span>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-content-strong">{ticket.requestedBy?.nameEn || 'Unknown'}</span>
                <span className="text-xs text-content-muted">{ticket.requestedBy?.department?.nameEn || 'N/A'}</span>
                {ticket.requestedBy?.phone && (
                  <span className="text-xs text-content-muted font-mono">{ticket.requestedBy.phone}</span>
                )}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-content-muted font-bold uppercase tracking-wider block mb-1">To</span>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-content-strong">{ticket.targetDepartment?.nameEn || 'N/A'}</span>
                <span className="text-xs text-content-muted">{ticket.assignedEmployee?.nameEn ? `Assigned: ${ticket.assignedEmployee.nameEn}` : 'Unassigned'}</span>
                {ticket.assignedEmployee?.phone && (
                  <span className="text-xs text-content-muted font-mono">{ticket.assignedEmployee.phone}</span>
                )}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-content-muted font-bold uppercase tracking-wider block mb-1">Category & Priority</span>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-content-strong">{ticket.category?.nameEn || 'General'}</span>
                <span className={`text-xs font-bold ${ticket.priority === 'HIGH' || ticket.priority === 'URGENT' ? 'text-red-600' : ticket.priority === 'LOW' ? 'text-slate-500' : 'text-blue-600'}`}>
                  {ticket.priority || 'NORMAL'} Priority
                </span>
              </div>
            </div>
            <div>
              <span className="text-[10px] text-content-muted font-bold uppercase tracking-wider block mb-1">Timeline</span>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-content-strong">{new Date(ticket.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                <span className={`text-xs font-bold ${ticket.dueAt ? 'text-red-600' : 'text-content-muted'}`}>
                  {ticket.dueAt ? `Due: ${new Date(ticket.dueAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}` : 'No Due Date'}
                </span>
              </div>
            </div>
            <div>
              <TicketStopwatch ticket={ticket} locale={locale} variant="card" />
            </div>
          </div>
          
          {ticket.rating && (
            <div className="bg-amber-50/50 border-t border-amber-100 p-5">
              <div className="flex items-center gap-2 mb-2">
                <Star className="size-4 text-amber-500 fill-amber-500" />
                <span className="font-bold text-amber-700 text-sm">Rated {ticket.rating.score} / 5</span>
              </div>
              {ticket.rating.comment && (
                <p className="text-sm text-amber-900 italic border-l-2 border-amber-300 pl-3">"{ticket.rating.comment}"</p>
              )}
            </div>
          )}
        </div>

        {/* Activity Log */}
        <div className="shrink-0 rounded-2xl border border-line-subtle bg-surface shadow-sm overflow-hidden">
          <div className="border-b border-line-subtle bg-surface-canvas/50 px-4 py-3">
            <h3 className="font-semibold text-content-strong flex items-center gap-2">
              <History className="size-4 text-brand" />
              Activity Log
            </h3>
          </div>
          <div className="p-4 flex flex-col gap-4">
            {!ticket.activities || ticket.activities.length === 0 ? (
              <p className="text-sm text-content-muted text-center">No activity yet.</p>
            ) : (
              <div className="relative border-l-2 border-line-subtle ml-4 pl-6 pb-2">
                {ticket.activities.map((activity: any, idx: number) => {
                  const isStatusChange = activity.action.startsWith('STATUS_CHANGED');
                  let actionText = activity.action.replace(/_/g, ' ').toLowerCase();
                  if (isStatusChange) {
                    const statusCode = activity.action.replace(/^STATUS_CHANGED_?/, '');
                    const localizedStatus = internalTicketStatusLabel(locale, statusCode);
                    actionText = isAr ? `تغيير الحالة إلى: ${localizedStatus}` : `status changed to ${localizedStatus}`;
                  }
                  const actorName = isAr && activity.actor?.nameAr ? activity.actor.nameAr : (activity.actor?.nameEn || activity.actorId);
                  return (
                    <div key={activity.id} className="relative mb-6 last:mb-0">
                      <div className={`absolute -left-[35px] top-0 grid size-6 place-items-center rounded-full border-2 border-surface shadow-sm ${isStatusChange ? 'bg-brand text-white' : 'bg-surface-canvas text-content-muted'}`}>
                        {isStatusChange ? <CheckCircle2 className="size-3.5" /> : <Clock className="size-3.5" />}
                      </div>
                      <div>
                        <p className="text-sm text-content-strong mb-0.5">
                          <span className="font-bold">{actorName}</span> 
                          <span className="text-content-muted ml-1.5">{actionText}</span>
                        </p>
                        <p className="text-[11px] font-medium text-content-muted mb-1.5">
                          {new Date(activity.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                        {activity.details?.reason && (
                          <div className="rounded-md bg-surface-canvas/50 border border-line-subtle p-2 text-xs text-content-strong">
                            <span className="font-semibold text-content-muted mr-1">Reason:</span>
                            {activity.details.reason}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

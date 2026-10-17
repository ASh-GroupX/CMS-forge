import React from 'react';
import { Paperclip } from 'lucide-react';
import type { ComplaintTimelineItem } from '../../lib/staff-complaint-timeline-api';

export function WorkingNotesList({ timeline, complaintId }: { timeline: ComplaintTimelineItem[]; complaintId: string }) {
  // Combine comments and unique uploaded attachments (ignoring scan/download audit noise)
  const seenAttachmentIds = new Set<string>();
  const notes = timeline.filter((t) => {
    if (t.type === 'COMMENT') return true;
    if (t.type === 'ATTACHMENT' && t.related?.id) {
      const action = t.metadata?.action;
      if (action && action !== 'attachment_uploaded') return false;
      if (seenAttachmentIds.has(t.related.id)) return false;
      seenAttachmentIds.add(t.related.id);
      return true;
    }
    return false;
  });

  if (notes.length === 0) {
    return <p className="text-sm text-content-muted text-center py-8">No notes yet.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {notes.map((note) => {
        const isAttachment = note.type === 'ATTACHMENT';
        
        return (
          <div key={note.id} className="flex gap-3">
            <div className="mt-1 grid size-8 shrink-0 place-items-center rounded-full bg-brand/10 text-brand font-bold text-xs">
              {note.actor?.name?.[0] || 'S'}
            </div>
            <div className="flex flex-col flex-1 rounded-xl rounded-tl-sm bg-surface p-3 shadow-sm border border-line-subtle">
              <div className="mb-1.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-content-strong">{note.actor?.name || 'System'}</span>
                  {note.actor?.role && (
                    <span className="rounded bg-brand/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-brand">
                      {note.actor.role}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium text-content-muted">
                  {new Date(note.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                </span>
              </div>
              
              {!isAttachment && (
                <p className="text-sm text-content-strong whitespace-pre-wrap leading-relaxed">
                  {note.body || note.summary}
                </p>
              )}

              {isAttachment && note.related?.id && (
                <div className={!isAttachment ? "mt-2 pt-2 border-t border-line-subtle flex flex-col gap-1.5" : "flex flex-col gap-1.5"}>
                  <div className="flex flex-wrap gap-2">
                    <a 
                      href={`/api/complaints/${complaintId}/attachments/${note.related.id}/download?redirect=1`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-lg border border-line-subtle bg-surface-canvas px-2 py-1.5 hover:bg-surface-raised hover:border-brand/30 transition-colors"
                    >
                      <Paperclip className="size-3.5 text-content-muted" />
                      <span className="text-xs font-medium text-content-strong truncate max-w-[150px]" title={note.related.label || 'Attachment'}>
                        {note.related.label || 'Attachment'}
                      </span>
                      {note.metadata?.sizeBytes && (
                        <span className="text-[10px] text-content-muted">
                          ({Math.round(Number(note.metadata.sizeBytes) / 1024)}KB)
                        </span>
                      )}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

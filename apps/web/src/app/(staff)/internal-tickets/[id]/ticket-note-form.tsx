'use client';

import React, { useState } from 'react';
import { Send, Paperclip } from 'lucide-react';
import { toast } from 'sonner';
import { addTicketNote } from '../../../../lib/staff-internal-tickets-actions';
import { useRouter } from 'next/navigation';
import { attachmentFileToBase64, normalizeAttachmentMime, validateAttachmentFile } from '../../../../lib/attachment-file-policy';

export function TicketNoteForm({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFilesChange = (selectedFiles: File[]) => {
    for (const f of selectedFiles) {
      const val = validateAttachmentFile(f);
      if (!val.ok) {
        if (val.code === 'ATTACHMENT_SIZE_EXCEEDED') {
          toast.error(`File "${f.name}" exceeds the 5MB size limit.`);
        } else {
          toast.error(`File "${f.name}" is not allowed. Only JPG images (.jpg, .jpeg) are allowed.`);
        }
        return;
      }
    }
    setFiles(selectedFiles);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && files.length === 0) return;

    for (const f of files) {
      const val = validateAttachmentFile(f);
      if (!val.ok) {
        if (val.code === 'ATTACHMENT_SIZE_EXCEEDED') {
          toast.error(`File "${f.name}" exceeds the 5MB size limit.`);
        } else {
          toast.error(`File "${f.name}" is not allowed. Only JPG images (.jpg, .jpeg) are allowed.`);
        }
        return;
      }
    }

    setLoading(true);
    try {
      let attachmentsPayload: any[] = [];
      if (files.length > 0) {
        attachmentsPayload = await Promise.all(
          files.map(async (f) => ({
            fileName: f.name,
            contentType: normalizeAttachmentMime(f.name, f.type),
            sizeBytes: f.size,
            contentBase64: await attachmentFileToBase64(f),
          }))
        );
      }

      await addTicketNote(ticketId, content, attachmentsPayload);
      setContent('');
      setFiles([]);
      router.refresh();
      toast.success('Note added successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to add note');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 px-1">
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
              <span className="max-w-[150px] truncate">{f.name}</span>
              <button type="button" onClick={() => setFiles(fs => fs.filter((_, idx) => idx !== i))} className="hover:text-brand-hover">&times;</button>
            </div>
          ))}
        </div>
      )}
      <form 
        onSubmit={handleSubmit}
        className="flex items-center gap-2 rounded-xl border border-line-subtle bg-surface px-3 py-2 focus-within:border-brand focus-within:ring-1 focus-within:ring-brand"
      >
        <button 
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="rounded-md p-1.5 text-content-muted hover:text-content-strong disabled:opacity-50"
          disabled={loading}
        >
          <Paperclip className="size-4" />
        </button>
        <input 
          type="file"
          multiple
          accept=".jpg,.jpeg,image/jpeg"
          className="hidden"
          ref={fileInputRef}
          onChange={(e) => handleFilesChange(Array.from(e.target.files || []))}
        />
        <input 
          name="note" 
          type="text" 
          placeholder="Add a private note..." 
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-content-muted" 
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={loading}
        />
        <button 
          type="submit" 
          className="rounded-md bg-brand p-1.5 text-white hover:bg-brand-hover disabled:opacity-50"
          disabled={loading || (!content.trim() && files.length === 0)}
        >
          <Send className="size-3.5" />
        </button>
      </form>
    </div>
  );
}

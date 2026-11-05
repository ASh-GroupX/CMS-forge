'use client';

import { useCallback, useEffect, useRef, useState, type SetStateAction, type FormEvent } from 'react';
import { enterStaffSession, readStaffSession, removeStaffSession, staffSessionKey, writeStaffSession } from './staff-navigation-session';

export type TicketDraft = {
  title: string; description: string; dateMode: 'relative' | 'specific'; timeIndex: number; specificDate: string;
  assignmentMode: 'department' | 'officer'; selectedDepartmentId: string; selectedRequestedEmployeeId: string;
  selectedCategoryId: string; selectedPriority: string; customFieldValues: Record<string, any>; attachmentNames: string[];
};
const initial: TicketDraft = { title: '', description: '', dateMode: 'relative', timeIndex: 4, specificDate: '', assignmentMode: 'department',
  selectedDepartmentId: '', selectedRequestedEmployeeId: '', selectedCategoryId: '', selectedPriority: 'NORMAL', customFieldValues: {}, attachmentNames: [] };
const files = new Map<string, File[]>();
if (typeof window !== 'undefined') window.addEventListener('cms:clear-draft-files', () => files.clear());
export function sanitizeTicketDraft(value: unknown): TicketDraft | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const draft: TicketDraft = { ...initial, customFieldValues: {}, attachmentNames: [] };
  for (const key of ['title', 'description', 'specificDate', 'selectedDepartmentId', 'selectedRequestedEmployeeId', 'selectedCategoryId', 'selectedPriority'] as const) {
    if (typeof record[key] === 'string') draft[key] = record[key];
  }
  draft.dateMode = record.dateMode === 'specific' ? 'specific' : 'relative';
  draft.assignmentMode = record.assignmentMode === 'officer' ? 'officer' : 'department';
  if (typeof record.timeIndex === 'number' && Number.isInteger(record.timeIndex) && record.timeIndex >= 0 && record.timeIndex < 100) draft.timeIndex = record.timeIndex;
  if (record.customFieldValues && typeof record.customFieldValues === 'object' && !Array.isArray(record.customFieldValues)) {
    draft.customFieldValues = Object.fromEntries(Object.entries(record.customFieldValues).filter(([, entry]) => ['string', 'number', 'boolean'].includes(typeof entry) || entry === null));
  }
  if (Array.isArray(record.attachmentNames)) draft.attachmentNames = record.attachmentNames.filter((entry): entry is string => typeof entry === 'string');
  return draft;
}
export function hasTicketDraft(value: TicketDraft): boolean {
  return (Object.keys(initial) as (keyof TicketDraft)[]).some(key => JSON.stringify(value[key]) !== JSON.stringify(initial[key]));
}
export function useTicketDraft(owner: string | null) {
  const key = owner ? staffSessionKey(owner, 'new-ticket') : '';
  const [draft, setDraft] = useState<TicketDraft>(initial);
  const [ready, setReady] = useState(false);
  const [restored, setRestored] = useState(false);
  const [available, setAvailable] = useState(Boolean(owner));
  const latest = useRef(draft);
  latest.current = draft;
  const suppressed = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const fileInput = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (owner) enterStaffSession(owner);
    const saved = key ? sanitizeTicketDraft(readStaffSession(key)) : null;
    if (saved) { setDraft(saved); setRestored(true); }
    else { setDraft(initial); files.delete(key); }
    suppressed.current = false;
    setReady(true);
  }, [key, owner]);
  const persist = useCallback(() => {
    if (!key || suppressed.current) return;
    const current = latest.current;
    if (!hasTicketDraft(current)) { removeStaffSession(key); return; }
    const ok = writeStaffSession(key, current);
    if (formRef.current) formRef.current.dataset.draftPersisted = String(ok);
    setAvailable(ok);
  }, [key]);
  useEffect(() => { if (ready) persist(); }, [draft, ready, persist]);
  useEffect(() => {
    const clear = () => { suppressed.current = true; };
    window.addEventListener('cms:flush-drafts', persist);
    window.addEventListener('cms:clear-draft-files', clear);
    window.addEventListener('pagehide', persist);
    return () => { persist(); window.removeEventListener('cms:flush-drafts', persist); window.removeEventListener('cms:clear-draft-files', clear); window.removeEventListener('pagehide', persist); };
  }, [persist]);
  function update<K extends keyof TicketDraft>(field: K, value: SetStateAction<TicketDraft[K]>) {
    suppressed.current = false;
    setDraft(previous => ({ ...previous, [field]: typeof value === 'function' ? (value as (old: TicketDraft[K]) => TicketDraft[K])(previous[field]) : value }));
  }
  function clear(reset = false) {
    suppressed.current = true;
    if (key) removeStaffSession(key);
    files.delete(key);
    if (fileInput.current) fileInput.current.value = '';
    if (formRef.current) formRef.current.dataset.draftHasFiles = 'false';
    if (reset) { setDraft(initial); setRestored(false); }
  }
  const attachmentRef = useCallback((input: HTMLInputElement | null) => {
    fileInput.current = input;
    const saved = files.get(key);
    if (input && saved?.length) { const transfer = new DataTransfer(); for (const file of saved) transfer.items.add(file); input.files = transfer.files; }
  }, [key]);
  function captureFiles(event: FormEvent<HTMLFormElement>) {
    const input = event.target;
    if (input instanceof HTMLInputElement && input.type === 'file') {
      const selected = Array.from(input.files ?? []);
      files.set(key, selected);
      if (formRef.current) formRef.current.dataset.draftHasFiles = String(selected.length > 0);
      update('attachmentNames', selected.map(file => file.name));
    }
  }
  return { draft, update, ready, restored, available, clear, formRef, attachmentRef, captureFiles,
    missingFiles: ready && draft.attachmentNames.length > 0 && !files.get(key)?.length };
}

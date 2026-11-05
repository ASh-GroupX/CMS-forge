'use client';
import React, { createContext, useContext, useEffect, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { enterStaffSession, readStaffSession, staffSessionKey, writeStaffSession } from './staff-navigation-session';

const Owner = createContext<string | null>(null);
export function StaffNavigationScope({ owner, children }: { owner: string | null; children: ReactNode }) {
  return <Owner.Provider value={owner}>{children}</Owner.Provider>;
}
function compatible(value: unknown, initial: unknown): boolean {
  if (initial === null) return value === null || typeof value === 'string';
  if (Array.isArray(initial)) return Array.isArray(value) && value.every(entry => typeof entry === typeof initial[0]);
  return typeof value === typeof initial && (typeof initial !== 'object' || value !== null && !Array.isArray(value));
}
export function useStaffUiState<T>(name: string, initial: T | (() => T)): [T, Dispatch<SetStateAction<T>>] {
  const owner = useContext(Owner);
  const [value, setValue] = useState<T>(initial);
  const [ready, setReady] = useState(false);
  const initialValue = useRef(value);
  const latest = useRef(value);
  latest.current = value;
  const key = useRef('');
  const stopped = useRef(false);
  useEffect(() => {
    if (!owner) return;
    enterStaffSession(owner);
    key.current = staffSessionKey(owner, `view:${location.pathname}:${name}`);
    const saved = readStaffSession<T>(key.current);
    const explicitQuery = [...new URLSearchParams(location.search).keys()].some(param => param !== 'locale');
    setValue(!explicitQuery && compatible(saved, initialValue.current) ? saved as T : initialValue.current);
    stopped.current = false;
    setReady(true);
  }, [owner, name]);
  useEffect(() => {
    if (owner && ready && key.current && !stopped.current) writeStaffSession(key.current, value);
  }, [value, ready, owner]);
  useEffect(() => {
    const flush = () => { if (owner && key.current && !stopped.current) writeStaffSession(key.current, latest.current); };
    const clear = () => { stopped.current = true; };
    window.addEventListener('cms:flush-drafts', flush); window.addEventListener('cms:clear-draft-files', clear);
    return () => { window.removeEventListener('cms:flush-drafts', flush); window.removeEventListener('cms:clear-draft-files', clear); };
  }, [owner]);
  return [value, update => { stopped.current = false; setValue(update); }];
}

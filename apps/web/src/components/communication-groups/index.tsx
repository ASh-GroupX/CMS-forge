'use client';

import { Pencil, Plus, Power, X } from 'lucide-react';
import React, { useMemo, useRef, useState } from 'react';
import { communicationGroupsText } from '../../i18n/staff-communication-groups';
import type { Locale } from '../../i18n/staff-shell';
import { formatDisplayNumber } from '../../lib/locale-format';
import { deactivateCommunicationGroup, writeCommunicationGroup, type StaffCommunicationGroup, type StaffCommunicationGroups, type StaffGroupMember } from '../../lib/staff-communication-groups-api';
import { ActionDialog } from '../shared/action-dialog';
import { StateBlock } from '../shared/ui-primitives';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

type UiState = { tone: 'error' | 'success'; message: string } | null;

export function CommunicationGroups({ data, loadState, locale }: { data: StaffCommunicationGroups | null; loadState: 'loading' | 'ready' | 'denied' | 'error'; locale: Locale }) {
  const t = communicationGroupsText[locale];
  const [groups, setGroups] = useState(data?.items ?? []);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<StaffCommunicationGroup | null>(null);
  const [name, setName] = useState('');
  const [visibility, setVisibility] = useState<'PERSONAL' | 'SHARED'>('PERSONAL');
  const [members, setMembers] = useState<StaffGroupMember[]>([]);
  const [query, setQuery] = useState('');
  const [state, setState] = useState<UiState>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const eligible = data?.eligibleMembers ?? [];
  const available = useMemo(() => eligible.filter((member) => !members.some((selected) => selected.userId === member.userId) && (!query.trim() || `${member.displayName} ${member.displayNameAr}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))), [eligible, members, query]);
  const personal = groups.filter((group) => group.visibility === 'PERSONAL');
  const shared = groups.filter((group) => group.visibility === 'SHARED');

  function begin(group: StaffCommunicationGroup | null, trigger: HTMLElement) {
    returnFocus.current = trigger; setEditing(group); setName(group?.name ?? ''); setVisibility(group?.visibility ?? 'PERSONAL'); setMembers(group?.members ?? []); setQuery(''); setState(null); setFormOpen(true);
  }
  function closeForm() {
    setFormOpen(false); setEditing(null); setName(''); setMembers([]); setQuery('');
    window.setTimeout(() => returnFocus.current?.focus(), 0);
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) { setState({ tone: 'error', message: t.validation }); return; }
    const result = await writeCommunicationGroup(editing?.id ?? null, { name: name.trim(), visibility, memberUserIds: members.map((member) => member.userId) });
    if (!result.ok) { setState({ tone: 'error', message: groupError(result.error.code, t) }); return; }
    setGroups((current) => editing ? current.map((group) => group.id === result.data.id ? result.data : group) : [...current, result.data]);
    setState({ tone: 'success', message: t.success }); closeForm();
  }
  async function deactivate(group: StaffCommunicationGroup) {
    const result = await deactivateCommunicationGroup(group.id);
    if (!result.ok) { setState({ tone: 'error', message: groupError(result.error.code, t) }); return; }
    setGroups((current) => current.filter((item) => item.id !== group.id));
    if (editing?.id === group.id) closeForm();
    setState({ tone: 'success', message: t.deactivated });
  }

  if (loadState !== 'ready' || !data) return <section className="grid gap-4" aria-label={t.title}><h1 className="text-lg font-semibold">{t.title}</h1><StateBlock message={loadState === 'loading' ? t.loading : loadState === 'denied' ? t.denied : t.loadError} tone={loadState === 'loading' ? 'neutral' : 'error'} /></section>;

  return <section className="grid gap-4" aria-label={t.title}>
    <header className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-lg font-semibold">{t.title}</h1><Button onClick={(event) => begin(null, event.currentTarget)} type="button"><Plus aria-hidden="true" className="size-4" />{t.create}</Button></header>
    {state ? <StateBlock message={state.message} tone={state.tone} /> : null}
    <GroupSection canManage groups={personal} label={t.personal} locale={locale} onDeactivate={deactivate} onEdit={begin} t={t} />
    <GroupSection canManage={data.canManageShared} groups={shared} label={t.shared} locale={locale} onDeactivate={deactivate} onEdit={begin} t={t} />
    {formOpen ? <form className="grid gap-3 border-t border-line-subtle pt-4" onSubmit={save} aria-label={editing ? fill(t.editTitle, editing.name) : t.createTitle}>
      <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-base font-semibold">{editing ? fill(t.editTitle, editing.name) : t.createTitle}</h2><Button aria-label={t.cancel} className="size-9 p-0" onClick={closeForm} title={t.cancel} type="button" variant="ghost"><X aria-hidden="true" className="size-4" /></Button></div>
      <Label className="grid gap-1 text-sm font-medium">{t.name}<Input onChange={(event) => setName(event.target.value)} value={name} /></Label>
      <Label className="grid gap-1 text-sm font-medium">{t.visibility}<Select disabled={Boolean(editing)} onValueChange={(value) => setVisibility(value as 'PERSONAL' | 'SHARED')} value={visibility}><SelectTrigger aria-label={t.visibility}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="PERSONAL">{t.personalOption}</SelectItem>{data.canManageShared ? <SelectItem value="SHARED">{t.sharedOption}</SelectItem> : null}</SelectContent></Select></Label>
      <Label className="grid gap-1 text-sm font-medium">{t.search}<Input onChange={(event) => setQuery(event.target.value)} value={query} /></Label>
      <p className="text-sm font-medium">{t.members}</p>
      {available.length ? <MemberChoices add={t.add} locale={locale} members={available} onAdd={(member) => setMembers((current) => [...current, member])} /> : query.trim() ? <StateBlock message={t.noResults} /> : null}
      <MemberChips label={t.members} locale={locale} members={members} onRemove={(id) => setMembers((current) => current.filter((member) => member.userId !== id))} remove={t.remove} />
      <div className="flex flex-wrap gap-2"><Button type="submit">{t.save}</Button><Button onClick={closeForm} type="button" variant="outline">{t.cancel}</Button></div>
    </form> : null}
  </section>;
}

function GroupSection({ canManage, groups, label, locale, onDeactivate, onEdit, t }: { canManage: boolean; groups: StaffCommunicationGroup[]; label: string; locale: Locale; onDeactivate: (group: StaffCommunicationGroup) => Promise<void>; onEdit: (group: StaffCommunicationGroup, trigger: HTMLElement) => void; t: typeof communicationGroupsText.en }) {
  return <section className="grid gap-2 border-t border-line-subtle pt-3"><h2 className="text-sm font-semibold">{label}</h2>{groups.length ? groups.map((group) => <article className="grid gap-2 border border-line-subtle bg-surface-raised p-3" key={group.id}><div className="flex flex-wrap items-start justify-between gap-2"><div><strong>{group.name}</strong><p className="mt-1 text-xs text-content-muted">{group.visibility === 'PERSONAL' ? t.personalOption : t.sharedOption} · {fill(t.memberCount, formatDisplayNumber(group.members.length, locale))}</p></div>{canManage ? <div className="flex gap-1"><Button onClick={(event) => onEdit(group, event.currentTarget)} size="sm" type="button" variant="outline"><Pencil aria-hidden="true" className="size-4" />{t.edit}</Button><ActionDialog description={t.deactivateDescription} footer={<Button onClick={() => void onDeactivate(group)} type="button" variant="destructive"><Power aria-hidden="true" className="size-4" />{t.deactivate}</Button>} title={fill(t.deactivateTitle, group.name)} trigger={<Button size="sm" type="button" variant="outline"><Power aria-hidden="true" className="size-4" />{t.deactivate}</Button>}><p className="text-sm font-medium">{group.name}</p></ActionDialog></div> : null}</div><MemberPreview group={group} locale={locale} t={t} /></article>) : <StateBlock message={t.empty} />}</section>;
}
function MemberPreview({ group, locale, t }: { group: StaffCommunicationGroup; locale: Locale; t: typeof communicationGroupsText.en }) { const preview = group.members.slice(0, 3).map((member) => displayMember(member, locale)); const remaining = group.members.length - preview.length; return <p className="text-sm text-content-muted">{preview.join(locale === 'ar' ? '، ' : ', ')}{remaining > 0 ? ` ${fill(t.previewMore, formatDisplayNumber(remaining, locale))}` : ''}</p>; }
function MemberChoices({ add, locale, members, onAdd }: { add: string; locale: Locale; members: StaffGroupMember[]; onAdd: (member: StaffGroupMember) => void }) { return <div className="grid max-h-48 gap-1 overflow-y-auto border border-line-subtle bg-surface p-2">{members.map((member) => <div className="flex items-center justify-between gap-2 text-sm" key={member.userId}><span className="min-w-0 break-words">{displayMember(member, locale)}</span><Button onClick={() => onAdd(member)} size="sm" type="button" variant="outline"><Plus aria-hidden="true" className="size-4" />{add}</Button></div>)}</div>; }
function MemberChips({ label, locale, members, onRemove, remove }: { label: string; locale: Locale; members: StaffGroupMember[]; onRemove: (id: string) => void; remove: string }) { return members.length ? <div className="flex flex-wrap gap-2" aria-label={label}>{members.map((member) => <span className="inline-flex max-w-full items-center gap-1 rounded-sm border border-line-subtle bg-surface px-2 py-1 text-sm" key={member.userId}><span className="truncate">{displayMember(member, locale)}</span><Button aria-label={`${remove} ${displayMember(member, locale)}`} className="size-7 p-0" onClick={() => onRemove(member.userId)} title={remove} type="button" variant="ghost"><X aria-hidden="true" className="size-4" /></Button></span>)}</div> : null; }
function displayMember(member: StaffGroupMember, locale: Locale): string { return locale === 'ar' ? member.displayNameAr || member.displayName : member.displayName || member.displayNameAr; }
function fill(value: string, replacement: string): string { return value.replace('{count}', replacement).replace('{name}', replacement); }
function groupError(code: string, t: typeof communicationGroupsText.en): string { if (code === 'RBAC_FORBIDDEN' || code === 'BRANCH_SCOPE_FORBIDDEN') return t.permissionError; if (code === 'NETWORK_ERROR') return t.networkError; return t.error; }

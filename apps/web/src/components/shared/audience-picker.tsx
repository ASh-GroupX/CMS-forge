'use client';

import { AtSign, UserCheck, Users, X } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { collaborationText } from '../../i18n/staff-collaboration';
import type { Locale } from '../../i18n/staff-shell';
import { formatDisplayNumber } from '../../lib/locale-format';
import type { CollaborationTarget, CommunicationTargets } from '../../lib/staff-complaint-comments-api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ActionDialog } from './action-dialog';
import { StateBlock } from './ui-primitives';

type TargetSetter = React.Dispatch<React.SetStateAction<CollaborationTarget[]>>;
type AssigneeControl = { selected: CollaborationTarget | null; onSelect: (target: CollaborationTarget) => void };

export function AudiencePicker({ assignee, cc, disabled = false, loadTargets, locale, mentions, onLoaded, onRemoveWatcher, setCc, setMentions }: {
  assignee?: AssigneeControl | undefined;
  cc: CollaborationTarget[];
  disabled?: boolean;
  loadTargets: (query: string) => Promise<CommunicationTargets | null>;
  locale: Locale;
  mentions: CollaborationTarget[];
  onLoaded?: (data: CommunicationTargets) => void;
  onRemoveWatcher?: (userId: string) => Promise<boolean>;
  setCc: TargetSetter;
  setMentions: TargetSetter;
}) {
  const t = collaborationText[locale];
  const [query, setQuery] = useState('');
  const [data, setData] = useState<CommunicationTargets | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [watcherError, setWatcherError] = useState(false);
  const trimmedQuery = query.trim();
  const canSearch = trimmedQuery.length === 0 || trimmedQuery.length >= 2;

  useEffect(() => {
    if (!canSearch) return;
    let current = true;
    const timer = window.setTimeout(() => {
      setState('loading');
      void loadTargets(trimmedQuery).then((result) => {
        if (!current) return;
        setData(result);
        setState(result ? 'ready' : 'error');
        if (result) onLoaded?.(result);
      });
    }, trimmedQuery ? 250 : 0);
    return () => { current = false; window.clearTimeout(timer); };
  }, [canSearch, loadTargets, onLoaded, trimmedQuery]);

  const selectedReach = useMemo(() => mentions.reduce((sum, item) => sum + item.recipientCount, 0) + cc.length, [cc, mentions]);
  const mentionIds = new Set(mentions.map((item) => `${item.type}:${item.id}`));

  async function removeWatcher(userId: string) {
    if (!onRemoveWatcher) return;
    setWatcherError(false);
    if (await onRemoveWatcher(userId)) setData((current) => current ? { ...current, currentWatchers: current.currentWatchers.filter((item) => item.userId !== userId) } : current);
    else setWatcherError(true);
  }

  return (
    <section className="grid gap-4 border-t border-line-subtle pt-4" aria-label={t.title}>
      <header className="grid gap-1"><h3 className="text-sm font-semibold">{t.title}</h3><p className="text-sm text-content-muted">{t.intro}</p></header>
      <div className="grid gap-2 sm:grid-cols-3">
        <Explanation icon={<UserCheck aria-hidden="true" className="size-4" />} help={t.assigneeHelp} title={t.assignee} />
        <Explanation icon={<AtSign aria-hidden="true" className="size-4" />} help={t.mentionHelp} title={t.mention} />
        <Explanation icon={<Users aria-hidden="true" className="size-4" />} help={t.ccHelp} title={t.cc} />
      </div>
      <Label className="grid gap-1 text-sm font-medium">{t.search}<Input disabled={disabled} onChange={(event) => setQuery(event.target.value)} value={query} /></Label>
      <p className="text-xs text-content-muted">{trimmedQuery.length === 1 ? t.searchHint : t.groupHint}</p>
      {canSearch && state === 'loading' ? <StateBlock message={t.loading} /> : null}
      {state === 'error' ? <StateBlock message={t.error} tone="error" /> : null}
      {canSearch && state === 'ready' && data ? <TargetResults assignee={assignee} cc={cc} disabled={disabled} emptyMessage={trimmedQuery ? t.noResults : t.empty} items={data.targets} locale={locale} mentionIds={mentionIds} setCc={setCc} setMentions={setMentions} /> : null}
      <SelectedTargets locale={locale} onRemove={(kind, target) => kind === 'mention' ? setMentions((items) => without(items, target)) : setCc((items) => without(items, target))} selections={[...mentions.map((target) => ({ kind: 'mention' as const, target })), ...cc.map((target) => ({ kind: 'cc' as const, target }))]} />
      {data ? <p className="text-xs text-content-muted">{fill(t.estimatedAudience, { count: formatDisplayNumber(selectedReach, locale) })} {fill(t.audienceRule, { count: formatDisplayNumber(data.confirmationRequiredAbove, locale), limit: formatDisplayNumber(data.recipientLimit, locale) })}</p> : null}
      {data ? <WatcherList canManage={data.capabilities.canManageWatchers} locale={locale} onRemove={removeWatcher} watchers={data.currentWatchers} /> : null}
      {watcherError ? <StateBlock message={t.removeWatcherError} tone="error" /> : null}
    </section>
  );
}

function TargetResults({ assignee, cc, disabled, emptyMessage, items, locale, mentionIds, setCc, setMentions }: { assignee?: AssigneeControl | undefined; cc: CollaborationTarget[]; disabled: boolean; emptyMessage: string; items: CollaborationTarget[]; locale: Locale; mentionIds: Set<string>; setCc: TargetSetter; setMentions: TargetSetter }) {
  const t = collaborationText[locale];
  if (!items.length) return <StateBlock message={emptyMessage} />;
  return <div className="grid max-h-64 gap-1 overflow-y-auto border border-line-subtle bg-surface p-2">{items.map((item) => <div className="grid gap-2 border-b border-line-subtle py-2 last:border-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center" key={`${item.type}:${item.id}`}><div className="min-w-0"><p className="break-words text-sm font-medium">{display(item, locale)}</p><p className="text-xs text-content-muted">{t.targetTypes[item.type]} - {formatDisplayNumber(item.recipientCount, locale)}</p></div><div className="flex flex-wrap gap-1"><Button disabled={disabled || mentionIds.has(`${item.type}:${item.id}`)} onClick={() => setMentions((current) => add(current, item))} size="sm" type="button" variant="outline"><AtSign aria-hidden="true" className="size-4" />{t.addMention}</Button>{item.type === 'USER' ? <Button disabled={disabled || cc.some((target) => target.id === item.id)} onClick={() => setCc((current) => add(current, item))} size="sm" type="button" variant="outline"><Users aria-hidden="true" className="size-4" />{t.addCc}</Button> : null}{item.type === 'USER' && assignee ? <Button disabled={disabled || assignee.selected?.id === item.id} onClick={() => assignee.onSelect(item)} size="sm" type="button" variant="outline"><UserCheck aria-hidden="true" className="size-4" />{t.assign}</Button> : null}</div></div>)}</div>;
}

function SelectedTargets({ locale, onRemove, selections }: { locale: Locale; onRemove: (kind: 'mention' | 'cc', target: CollaborationTarget) => void; selections: { kind: 'mention' | 'cc'; target: CollaborationTarget }[] }) {
  const t = collaborationText[locale];
  if (!selections.length) return null;
  return <div className="grid gap-2" aria-label={t.selected}><p className="text-sm font-medium">{t.selected}</p><div className="flex flex-wrap gap-2">{selections.map(({ kind, target }) => <span className="inline-flex max-w-full items-center gap-1 rounded-sm border border-line-subtle bg-surface px-2 py-1 text-sm" key={`${kind}:${target.type}:${target.id}`}><span className="truncate">{kind === 'mention' ? '@' : t.cc}: {display(target, locale)}</span><Button aria-label={`${t.remove} ${display(target, locale)}`} className="size-7 p-0" onClick={() => onRemove(kind, target)} title={t.remove} type="button" variant="ghost"><X aria-hidden="true" className="size-4" /></Button></span>)}</div></div>;
}

function WatcherList({ canManage, locale, onRemove, watchers }: { canManage: boolean; locale: Locale; onRemove: (id: string) => Promise<void>; watchers: CommunicationTargets['currentWatchers'] }) {
  const t = collaborationText[locale];
  return <section className="grid gap-2" aria-label={t.currentCc}><h4 className="text-sm font-semibold">{t.currentCc}</h4>{watchers.length ? <ul className="grid gap-1">{watchers.map((watcher) => <li className="flex items-center justify-between gap-2 border-b border-line-subtle py-2 text-sm" key={watcher.userId}><span className="break-words">{locale === 'ar' ? watcher.nameAr || watcher.name : watcher.name || watcher.nameAr}</span>{canManage ? <ActionDialog description={t.removeWatcherDescription} footer={<Button onClick={() => void onRemove(watcher.userId)} type="button" variant="destructive">{t.removeWatcher}</Button>} title={t.removeWatcherTitle} trigger={<Button size="sm" type="button" variant="ghost">{t.removeWatcher}</Button>}><p className="text-sm font-medium">{locale === 'ar' ? watcher.nameAr || watcher.name : watcher.name || watcher.nameAr}</p></ActionDialog> : null}</li>)}</ul> : <p className="text-sm text-content-muted">{t.noWatchers}</p>}</section>;
}

function Explanation({ help, icon, title }: { help: string; icon: React.ReactNode; title: string }) { return <div className="grid content-start gap-1 border-s-2 border-line-strong ps-2"><p className="flex items-center gap-1 text-sm font-semibold">{icon}{title}</p><p className="text-xs text-content-muted">{help}</p></div>; }
function display(target: CollaborationTarget, locale: Locale): string { return locale === 'ar' ? target.labelAr || target.label : target.label || target.labelAr; }
function add(items: CollaborationTarget[], target: CollaborationTarget): CollaborationTarget[] { return items.some((item) => item.id === target.id && item.type === target.type) ? items : [...items, target]; }
function without(items: CollaborationTarget[], target: CollaborationTarget): CollaborationTarget[] { return items.filter((item) => item.id !== target.id || item.type !== target.type); }
function fill(value: string, replacements: Record<string, string>): string { return Object.entries(replacements).reduce((text, [key, replacement]) => text.replace(`{${key}}`, replacement), value); }

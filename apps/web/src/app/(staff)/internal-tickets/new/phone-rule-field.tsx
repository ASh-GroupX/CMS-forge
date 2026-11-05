'use client';

import React, { useEffect, useState } from 'react';
import { Input } from '../../../../components/ui/input';
import { Button } from '../../../../components/ui/button';
import { findTicketPhoneDuplicates, type PhoneDuplicateTicket } from '../../../../lib/staff-ticket-phone-actions';
import { ticketPhoneRuleText } from '../../../../i18n/staff-ticket-phone-rule';
import type { CustomFieldDef } from './custom-fields-renderer';

export function PhoneRuleField({ field, value, onChange, onAcknowledge, isAr = false, lookupVersion = 0 }: {
  field: CustomFieldDef; value: string; onChange: (value: string) => void;
  onAcknowledge: (value: boolean) => void; isAr?: boolean; lookupVersion?: number;
}) {
  const t = ticketPhoneRuleText[isAr ? 'ar' : 'en'];
  const [matches, setMatches] = useState<PhoneDuplicateTicket[] | null>(null);
  const [state, setState] = useState<'idle' | 'loading' | 'ready' | 'invalid' | 'error'>('idle');
  const [confirmed, setConfirmed] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setMatches(null);
    if (!value.trim()) { setState('idle'); return; }
    setState('loading');
    const timer = window.setTimeout(async () => {
      const result = await findTicketPhoneDuplicates({ departmentId: field.departmentId, fieldId: field.id, phone: value });
      if (!active) return;
      setState(result.error ? result.error === 'VALIDATION_FAILED' ? 'invalid' : 'error' : 'ready');
      setMatches(result.error ? null : result.items);
    }, 400);
    return () => { active = false; window.clearTimeout(timer); };
  }, [value, field.id, field.departmentId, retry, lookupVersion]);
  return <div className="space-y-2 sm:col-span-2">
    <label htmlFor={`phone-${field.id}`} className="text-sm font-semibold">{isAr ? field.nameAr : field.nameEn} *</label>
    <Input id={`phone-${field.id}`} type="tel" dir="ltr" required value={value} placeholder="+962790000000"
      aria-describedby={`phone-help-${field.id}`} onChange={event => { setConfirmed(false); onAcknowledge(false); onChange(event.target.value); }} />
    <p id={`phone-help-${field.id}`} className="text-xs text-muted-foreground">{t.hint}</p>
    {state === 'loading' && <p role="status" className="text-sm text-muted-foreground">{t.checking}</p>}
    {state === 'invalid' && <p role="alert" className="text-sm text-destructive">{t.hint}</p>}
    {state === 'error' && <div role="alert" className="space-y-2 text-sm text-destructive">{t.failed}<Button type="button" variant="outline" size="sm" onClick={() => setRetry(value => value + 1)}>{t.retry}</Button></div>}
    {state === 'ready' && matches?.length === 0 && <p role="status" className="text-xs text-muted-foreground">{t.noMatches}</p>}
    {state === 'ready' && !!matches?.length && <div className="space-y-3 rounded-lg border border-brand/30 bg-brand/5 p-4" role="status">
      <p className="text-sm font-semibold">{t.duplicate}</p><p className="text-sm text-muted-foreground">{t.followUp}</p>
      <ul className="space-y-2">{matches.map(ticket => <li key={ticket.id}><a className="break-words text-sm font-semibold text-brand underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={`/internal-tickets/${encodeURIComponent(ticket.id)}?locale=${isAr ? 'ar' : 'en'}`} target="_blank" rel="noopener noreferrer">{t.open}: {ticket.referenceNumber} — {ticket.title}</a></li>)}</ul>
      <Button type="button" className="h-auto max-w-full whitespace-normal text-start" variant={confirmed ? 'secondary' : 'outline'} aria-pressed={confirmed} onClick={() => { setConfirmed(!confirmed); onAcknowledge(!confirmed); }}>{confirmed ? t.confirmed : t.separate}</Button>
    </div>}
  </div>;
}

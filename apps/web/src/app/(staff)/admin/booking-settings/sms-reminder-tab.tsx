'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../../../../components/ui/button';
import { Checkbox } from '../../../../components/ui/checkbox';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Textarea } from '../../../../components/ui/textarea';
import type { ServiceBookingCopy } from '../../../../i18n/staff-service-booking';
import type { Locale } from '../../../../i18n/staff-shell';
import { getSmsReminderSettingsAction, updateSmsReminderSettingsAction } from './user-rules-actions';

type Settings = { enabled: boolean; leadHours: number; senderNumber: string; messageTemplate: string };
const defaults: Settings = { enabled: false, leadHours: 24, senderNumber: '', messageTemplate: '' };

type Delivery = { id: string; status: keyof ServiceBookingCopy['adminSettings']['smsReminder']['statuses']; scheduledAt: string | null; sentAt: string | null; serviceAppointment: { referenceNumber: string } | null };

export function SmsReminderTab({ t, locale }: { t: ServiceBookingCopy; locale: Locale }) {
  const copy = t.adminSettings.smsReminder;
  const [settings, setSettings] = useState(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);

  useEffect(() => {
    let active = true;
    void getSmsReminderSettingsAction().then((result) => {
      if (!active) return;
      if (!result.success || !result.settings) setError(copy.loadError);
      else {
        setSettings({ enabled: result.settings.enabled, leadHours: result.settings.leadHours, senderNumber: result.settings.senderNumber, messageTemplate: result.settings.messageTemplate });
        setDeliveries(result.settings.deliveries || []);
      }
      setLoading(false);
    });
    return () => { active = false; };
  }, [copy.loadError]);

  async function save() {
    setSaving(true); setError('');
    const result = await updateSmsReminderSettingsAction(settings);
    setSaving(false);
    if (!result.success) { setError(copy.saveError); return; }
    setDeliveries(result.settings?.deliveries || deliveries);
    toast.success(copy.saved);
  }

  if (loading) return <p role="status" className="rounded-2xl border border-line-subtle bg-surface p-5 text-sm text-content-muted">{copy.loading}</p>;

  return (
    <section className="max-w-3xl space-y-5 rounded-2xl border border-line-subtle bg-surface p-6" aria-label={copy.title}>
      <div>
        <h2 className="text-lg font-bold text-content-strong">{copy.title}</h2>
        <p className="mt-1 text-sm text-content-muted">{copy.description}</p>
      </div>
      <p className="rounded-xl border border-status-warning-border bg-status-warning-bg p-3 text-sm text-content-strong">{copy.testMode}</p>
      {error && <p role="alert" className="text-sm text-status-error">{error}</p>}
      <label className="flex items-center gap-3 text-sm font-medium text-content-strong">
        <Checkbox checked={settings.enabled} onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked === true })} />
        {copy.enabled}
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="sms-lead-hours">{copy.leadHours}</Label>
          <Input id="sms-lead-hours" type="number" min={1} max={720} value={settings.leadHours} onChange={(event) => setSettings({ ...settings, leadHours: Number(event.target.value) })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sms-sender-number">{copy.senderNumber}</Label>
          <Input id="sms-sender-number" dir="ltr" placeholder="+962790000000" value={settings.senderNumber} onChange={(event) => setSettings({ ...settings, senderNumber: event.target.value })} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="sms-message-template">{copy.message}</Label>
        <Textarea id="sms-message-template" dir="auto" rows={5} maxLength={1000} value={settings.messageTemplate} onChange={(event) => setSettings({ ...settings, messageTemplate: event.target.value })} />
        <p className="text-xs text-content-muted">{copy.placeholders}</p>
      </div>
      <Button type="button" disabled={saving || error === copy.loadError} onClick={() => void save()}>{saving ? copy.saving : copy.save}</Button>
      <div className="border-t border-line-subtle pt-4">
        <h3 className="text-sm font-bold text-content-strong">{copy.recent}</h3>
        {deliveries.length ? <ul className="mt-2 divide-y divide-line-subtle">
          {deliveries.map((item) => <li className="flex flex-wrap justify-between gap-2 py-2 text-sm" key={item.id}>
            <span>{item.serviceAppointment?.referenceNumber || '—'}</span>
            <span className="text-content-muted">{copy.statuses[item.status]}</span>
            <time className="text-content-muted" dateTime={item.sentAt || item.scheduledAt || undefined}>{new Date(item.sentAt || item.scheduledAt || '').toLocaleString(locale === 'ar' ? 'ar-JO' : 'en-GB')}</time>
          </li>)}
        </ul> : <p className="mt-2 text-sm text-content-muted">{copy.emptyRecent}</p>}
      </div>
    </section>
  );
}

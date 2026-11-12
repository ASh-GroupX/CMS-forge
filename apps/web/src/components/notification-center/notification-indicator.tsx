'use client';

import React, { useEffect, useState } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { notificationCenterText } from '../../i18n/staff-notification-center';
import type { Locale } from '../../i18n/staff-shell';

export function NotificationIndicator({ locale, href }: { locale: Locale; href: string }) {
  const copy = notificationCenterText[locale];
  const [unread, setUnread] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let disposed = false;
    let request: AbortController | null = null;
    const refresh = async () => {
      if (document.hidden || request) return;
      const controller = new AbortController();
      request = controller;
      const timeout = window.setTimeout(() => controller.abort(), 10000);
      try {
        const response = await fetch('/api/notifications?view=unread&limit=100', { cache: 'no-store', signal: controller.signal });
        if (!response.ok) throw new Error('Notifications unavailable');
        const body = await response.json() as { items?: unknown[] };
        if (!Array.isArray(body.items)) throw new Error('Invalid notifications');
        if (!disposed) { setUnread(body.items.length); setFailed(false); }
      } catch {
        if (!disposed) setFailed(true);
      } finally {
        window.clearTimeout(timeout);
        request = null;
      }
    };
    void refresh();
    const interval = window.setInterval(() => void refresh(), 30000);
    const onFocus = () => void refresh();
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      disposed = true;
      request?.abort();
      window.clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, []);
  const hasUnread = unread !== null && unread > 0;
  const count = unread === null ? '' : unread >= 100 ? '99+' : new Intl.NumberFormat(locale === 'ar' ? 'ar-JO' : 'en').format(unread);
  const label = failed ? copy.indicator.unavailable : unread === null ? copy.title : `${copy.title}: ${count} ${copy.labels.unread}`;
  const Icon = hasUnread ? BellRing : Bell;
  return <Button asChild variant={hasUnread ? 'outline' : 'ghost'}
    className={`relative h-12 min-w-12 shrink-0 gap-2 rounded-xl px-3 [&_svg]:size-6 ${hasUnread ? 'border-brand/40 bg-brand/10 text-brand shadow-sm ring-2 ring-brand/15 hover:bg-brand/15' : 'text-content-muted'}`}>
    <a aria-label={label} href={href} title={label}>
      <Icon aria-hidden="true" className="size-6 shrink-0" />
      <span className="hidden text-sm font-semibold text-content-strong lg:inline">{copy.title}</span>
      {unread !== null && <Badge aria-hidden="true" variant={hasUnread ? 'default' : 'secondary'}
        className={`absolute -end-1 -top-2 min-w-6 justify-center rounded-full px-1.5 py-0.5 text-xs font-bold ring-2 ring-surface ${hasUnread ? 'bg-brand text-primary-foreground' : ''}`}>{count}</Badge>}
      <span className="sr-only" role="status" aria-live="polite">{failed ? copy.indicator.unavailable : hasUnread ? `${count} ${copy.indicator.newActivity}` : unread === 0 ? copy.indicator.caughtUp : ''}</span>
    </a>
  </Button>;
}

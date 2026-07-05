import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

export type PrimitiveTone = 'brand' | 'danger' | 'info' | 'neutral' | 'success' | 'warning';

const toneClass: Record<PrimitiveTone, string> = {
  brand: 'border-transparent bg-brand text-brand-foreground',
  danger: 'border-transparent bg-status-error text-white',
  info: 'border-transparent bg-status-info text-white',
  neutral: 'border-line-subtle bg-surface-raised text-content-muted',
  success: 'border-transparent bg-status-success text-white',
  warning: 'border-transparent bg-status-warning text-slate-950',
};

export function PageHeader({
  actions,
  description,
  eyebrow,
  title,
}: {
  actions?: React.ReactNode;
  description?: string | undefined;
  eyebrow?: string | undefined;
  title: string;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        {eyebrow ? <p className="text-xs font-semibold text-content-muted">{eyebrow}</p> : null}
        <h1 className="text-xl font-semibold tracking-normal text-content-strong">{title}</h1>
        {description ? <p className="mt-1 max-w-3xl text-sm text-content-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}

export function StateBlock({
  className,
  message,
  title,
  tone = 'neutral',
}: {
  className?: string;
  message: string;
  title?: string;
  tone?: 'conflict' | 'error' | 'loading' | 'neutral' | 'success' | 'warning';
}) {
  const alert = tone === 'conflict' || tone === 'error' || tone === 'warning';
  const colors =
    tone === 'success'
      ? 'border-status-success-border bg-status-success-bg text-content-strong'
      : alert
        ? 'border-status-error-border bg-status-error-bg text-status-error'
        : 'border-line-subtle bg-surface-raised text-content-muted';
  return (
    <section className={cn('rounded-sm border px-3 py-2 text-sm', colors, className)} role={alert ? 'alert' : 'status'}>
      {title ? <p className="font-semibold">{title}</p> : null}
      <p className={title ? 'mt-1' : undefined}>{message}</p>
    </section>
  );
}

export function Field({
  children,
  className,
  error,
  id,
  label,
}: {
  children: React.ReactNode;
  className?: string | undefined;
  error?: string | undefined;
  id: string;
  label: string;
}) {
  return (
    <div className={cn('grid min-w-0 gap-1 text-sm font-medium', className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? <p className="text-xs font-semibold text-status-error">{error}</p> : null}
    </div>
  );
}

export function FilterBar({
  action,
  children,
  className,
  method = 'get',
}: {
  action: string;
  children: React.ReactNode;
  className?: string;
  method?: 'get' | 'post';
}) {
  return (
    <form action={action} className={cn('grid gap-2 border-b border-line-subtle p-4 md:grid-cols-6', className)} method={method}>
      {children}
    </form>
  );
}

export function DataTable({
  children,
  emptyMessage,
  headers,
  minWidth = '40rem',
}: {
  children: React.ReactNode;
  emptyMessage?: string;
  headers: readonly string[];
  minWidth?: string;
}) {
  return (
    <div className="hidden w-full min-w-0 max-w-full overflow-x-auto md:block">
      <Table style={{ minWidth }}>
        <TableHeader className="bg-surface-raised text-xs font-semibold uppercase tracking-normal text-content-muted">
          <TableRow>
            {headers.map((header) => (
              <TableHead className="text-start" key={header}>{header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {children ?? (
            <TableRow>
              <TableCell className="text-content-muted" colSpan={headers.length}>{emptyMessage}</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export function StatusBadge({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: PrimitiveTone }) {
  return <Badge className={cn('shadow-none', toneClass[tone])} variant="outline">{children}</Badge>;
}

export function MetricStrip({
  items,
}: {
  items: readonly { description: string; label: string; tone?: PrimitiveTone | undefined; value: string }[];
}) {
  return (
    <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
      {items.map((item) => (
        <div className="rounded-md border border-line-subtle bg-surface p-4 shadow-sm" key={item.label}>
          <p className="text-sm font-medium text-content-muted">{item.label}</p>
          <p className={cn('mt-2 text-3xl font-semibold tracking-normal text-content-strong', item.tone === 'brand' && 'text-brand', item.tone === 'danger' && 'text-status-error', item.tone === 'warning' && 'text-status-warning')}>
            {item.value}
          </p>
          <p className="mt-1 text-xs text-content-muted">{item.description}</p>
        </div>
      ))}
    </div>
  );
}

export function Timeline({ emptyText, items }: { emptyText: string; items: readonly { meta: string; text: string }[] }) {
  if (!items.length) return <StateBlock message={emptyText} />;
  return (
    <ol className="grid gap-2">
      {items.map((item) => (
        <li className="rounded-sm border border-line-subtle bg-surface px-3 py-2 text-sm" key={`${item.meta}-${item.text}`}>
          <p className="font-medium text-content-strong">{item.text}</p>
          {item.meta ? <p className="mt-1 text-xs text-content-muted">{item.meta}</p> : null}
        </li>
      ))}
    </ol>
  );
}

export function AttachmentDropzone({
  id,
  label,
  rules,
}: {
  id: string;
  label: string;
  rules: readonly string[];
}) {
  return (
    <div className="grid gap-3">
      <Field id={id} label={label}>
        <Input id={id} type="file" />
      </Field>
      <ul className="grid gap-1 text-sm text-content-muted">
        {rules.map((rule) => <li key={rule}>{rule}</li>)}
      </ul>
    </div>
  );
}

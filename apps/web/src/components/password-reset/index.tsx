import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { staffShellText, type Locale } from '../../i18n/staff-shell';
import { consumePasswordResetAction, requestPasswordResetAction } from '../../lib/staff-auth-actions';

export type ResetFixtureState = 'request' | 'requested' | 'token' | 'success' | 'invalid' | 'error';

export function PasswordReset({ locale, state }: { locale: Locale; state?: ResetFixtureState | undefined }) {
  const shell = staffShellText[locale];
  const t = shell.reset;
  const queryPrefix = `?locale=${locale}&reset=`;
  const showRequest = state === 'request' || state === 'requested' || state === 'error';
  const showToken = state === 'token' || state === 'success' || state === 'invalid';

  return (
    <Card aria-label={t.title} className="rounded-md border-line-subtle bg-surface shadow-sm" dir={shell.dir}>
      <CardHeader className="border-b border-line-subtle p-4">
        <CardTitle className="text-lg tracking-normal">{t.title}</CardTitle>
        <p className="text-sm text-content-muted">{t.help}</p>
      </CardHeader>
      <CardContent className="grid gap-3 p-4">
        {state ? null : (
          <div className="flex flex-wrap gap-2 text-sm font-semibold">
            <a className="text-brand underline" href={`${queryPrefix}request`}>
              {t.requestEntry}
            </a>
            <a className="text-brand underline" href={`${queryPrefix}token`}>
              {t.tokenEntry}
            </a>
          </div>
        )}

        {showRequest ? (
          <form action={requestPasswordResetAction} className="grid gap-3">
            <input name="locale" type="hidden" value={locale} />
            {state === 'requested' ? (
              <p className="rounded-sm border border-status-success bg-status-success/10 px-2 py-1 text-sm text-status-success" role="status">
                {t.requestSuccess}
              </p>
            ) : null}
            {state === 'error' ? (
              <p className="rounded-sm border border-status-error bg-status-error/10 px-2 py-1 text-sm text-status-error" role="alert">
                {t.resetError}
              </p>
            ) : null}
            <div className="grid gap-1">
              <Label htmlFor="reset-identifier">{t.identifier}</Label>
              <Input id="reset-identifier" name="identifier" autoComplete="username" required />
            </div>
            <Button type="submit">{t.requestSubmit}</Button>
            <a className="text-sm font-semibold text-brand underline" href={`${queryPrefix}token`}>
              {t.tokenEntry}
            </a>
          </form>
        ) : null}

        {showToken ? (
          <form action={consumePasswordResetAction} className="grid gap-3">
            <input name="locale" type="hidden" value={locale} />
            {state === 'success' ? (
              <p className="rounded-sm border border-status-success bg-status-success/10 px-2 py-1 text-sm text-status-success" role="status">
                {t.resetSuccess}
              </p>
            ) : null}
            {state === 'invalid' ? (
              <p className="rounded-sm border border-status-error bg-status-error/10 px-2 py-1 text-sm text-status-error" role="alert">
                {t.invalidToken}
              </p>
            ) : null}
            <div className="grid gap-1">
              <Label htmlFor="reset-token">{t.token}</Label>
              <Input id="reset-token" name="resetToken" autoComplete="off" required />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="new-password">{t.newPassword}</Label>
              <Input id="new-password" name="newPassword" type="password" autoComplete="new-password" minLength={12} required />
            </div>
            <Button type="submit">{t.resetSubmit}</Button>
            <a className="text-sm font-semibold text-brand underline" href={`${queryPrefix}request`}>
              {t.requestEntry}
            </a>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}

export { PasswordReset as PasswordResetPanel };

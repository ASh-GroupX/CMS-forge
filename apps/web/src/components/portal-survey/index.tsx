'use client';

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { StateBlock } from '../shared/ui-primitives';
import { portalSurveyText, type PortalSurveyLocale } from '../../i18n/portal-survey';
import { submitPortalSurvey, terminalSurveyState } from '../../lib/portal-survey-api';

export type PortalSurveyFixtureState = 'success' | 'used' | 'expired' | 'validation' | 'loading' | 'error' | 'missing';
type PortalSurveyClosedState = Extract<PortalSurveyFixtureState, 'expired' | 'missing' | 'success' | 'used'>;

export function PortalSurveyScreen({
  locale,
  state,
  surveyKey,
}: {
  locale: PortalSurveyLocale;
  state?: PortalSurveyFixtureState | undefined;
  surveyKey?: string | undefined;
}) {
  const t = portalSurveyText[locale];
  const [liveState, setLiveState] = useState<PortalSurveyFixtureState | undefined>(() => state ?? (surveyKey ? undefined : 'missing'));
  const closed = liveState === 'success' || liveState === 'used' || liveState === 'expired' || liveState === 'missing';

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const rating = Number(data.get('rating'));
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      setLiveState('validation');
      return;
    }
    if (!surveyKey) {
      setLiveState('missing');
      return;
    }
    setLiveState('loading');
    const result = await submitPortalSurvey({ key: surveyKey, rating, comment: String(data.get('comment') ?? '') });
    if (result.ok) {
      form.reset();
      setLiveState('success');
      return;
    }
    setLiveState(terminalSurveyState(result.code));
  }

  return (
    <section lang={t.lang} dir={t.dir} className="mx-auto grid w-full max-w-3xl gap-4" aria-label={t.title}>
      <PortalSurveyMessage locale={locale} state={liveState} />

      {closed && liveState ? <PortalSurveyTerminalCard locale={locale} state={liveState} /> : null}

      {closed ? null : (
        <Card className="rounded-md border-line-subtle bg-surface shadow-sm">
          <CardContent className="p-portal-card">
              <form className="grid gap-4" method="post" onSubmit={onSubmit}>
                <fieldset className="grid gap-3">
                  <legend className="text-sm font-semibold">{t.fields.rating}</legend>
                  <div className="grid grid-cols-5 gap-2">
                    {t.ratingLabels.map((label, index) => {
                      const value = String(index + 1);
                      return (
                        <Label className="grid min-h-24 content-center gap-2 rounded-sm border border-line-strong bg-surface-raised px-2 py-3 text-center text-sm font-semibold" key={label}>
                          <input className="mx-auto size-4" disabled={liveState === 'loading'} name="rating" type="radio" value={value} aria-label={label} />
                          <span>{value}</span>
                        </Label>
                      );
                    })}
                  </div>
                  {liveState === 'validation' ? <span className="text-xs font-semibold text-status-error">{t.states.validation}</span> : null}
                </fieldset>

                <Label className="grid gap-1 text-sm font-medium">
                  {t.fields.comment}
                  <Textarea className="min-h-28" disabled={liveState === 'loading'} name="comment" />
                </Label>

                <p className="rounded-sm bg-surface-raised px-3 py-2 text-sm text-content-muted">{t.privacy}</p>
                <Button className="min-h-11 focus:ring-2 focus:ring-ring" disabled={liveState === 'loading'} type="submit">
                  {liveState === 'loading' ? t.actions.submitting : t.actions.submit}
                </Button>
              </form>
          </CardContent>
        </Card>
      )}
    </section>
  );
}

function PortalSurveyMessage({ locale, state }: { locale: PortalSurveyLocale; state?: PortalSurveyFixtureState | undefined }) {
  const t = portalSurveyText[locale];
  if (!state) return null;
  if (state === 'success' || state === 'used' || state === 'expired' || state === 'missing') return null;
  return <StateBlock message={t.states[state]} tone={state === 'loading' ? 'neutral' : 'error'} />;
}

function PortalSurveyTerminalCard({ locale, state }: { locale: PortalSurveyLocale; state: PortalSurveyClosedState }) {
  const t = portalSurveyText[locale];
  const copy = t.terminal[state];
  const successful = state === 'success';
  return (
    <Card className={`rounded-md border-line-subtle bg-surface shadow-sm ${successful ? 'border-status-success' : ''}`} role={successful ? 'status' : 'alert'}>
      <CardContent className="grid gap-3 p-portal-card">
        <div className="grid gap-1">
          <h2 className="text-base font-semibold text-content-strong">{copy.title}</h2>
          <p className="text-sm text-content-muted">{copy.body}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild type="button">
            <a href={`/portal/track?locale=${locale}`}>{t.actions.trackComplaint}</a>
          </Button>
          <Button asChild type="button" variant="outline">
            <a href={`/portal?locale=${locale}`}>{t.actions.submitComplaint}</a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

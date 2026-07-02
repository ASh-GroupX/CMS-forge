'use client';

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { portalSurveyText, type PortalSurveyLocale } from '../../i18n/portal-survey';
import { submitPortalSurvey, terminalSurveyState } from '../../lib/portal-survey-api';

export type PortalSurveyPreviewState = 'success' | 'used' | 'expired' | 'validation' | 'loading' | 'error';

export function PortalSurveyScreen({
  locale,
  state,
  surveyKey,
}: {
  locale: PortalSurveyLocale;
  state?: PortalSurveyPreviewState | undefined;
  surveyKey?: string | undefined;
}) {
  const t = portalSurveyText[locale];
  const [liveState, setLiveState] = useState(state);
  const switchLocale = locale === 'ar' ? 'en' : 'ar';
  const closed = liveState === 'success' || liveState === 'used' || liveState === 'expired';
  const preserve = Boolean(liveState && liveState !== 'success' && !closed);

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
      setLiveState('error');
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
    <main lang={t.lang} dir={t.dir} className="min-h-screen bg-neutral p-4 text-neutral-foreground md:p-6">
      <div className="mx-auto grid max-w-3xl gap-4">
        <Card className="rounded-md border-slate-200 bg-white shadow-sm">
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0 p-4">
            <div>
              <CardTitle className="text-2xl tracking-normal">{t.title}</CardTitle>
              <p className="mt-1 max-w-2xl text-sm text-slate-600">{t.subtitle}</p>
            </div>
            <Button asChild size="sm" variant="outline" className="focus:ring-2 focus:ring-ring">
              <a href={`/portal/survey?locale=${switchLocale}`} aria-label={t.switchLabel}>{t.switchTarget}</a>
            </Button>
          </CardHeader>
        </Card>

        <PortalSurveyMessage locale={locale} state={liveState} />

        {closed ? null : (
          <Card className="rounded-md border-slate-200 bg-white shadow-sm">
            <CardContent className="p-4">
              <form className="grid gap-4" method="post" onSubmit={onSubmit}>
                <fieldset className="grid gap-3">
                  <legend className="text-sm font-semibold">{t.fields.rating}</legend>
                  <div className="grid grid-cols-5 gap-2">
                    {t.ratingLabels.map((label, index) => {
                      const value = String(index + 1);
                      return (
                        <Label className="grid min-h-20 content-center gap-2 rounded-sm border border-slate-300 bg-slate-50 px-2 py-3 text-center text-sm font-semibold" key={label}>
                          <input className="mx-auto size-4" defaultChecked={preserve && value === '4'} disabled={liveState === 'loading'} name="rating" type="radio" value={value} aria-label={label} />
                          <span>{value}</span>
                        </Label>
                      );
                    })}
                  </div>
                  {liveState === 'validation' ? <span className="text-xs font-semibold text-red-700">{t.states.validation}</span> : null}
                </fieldset>

                <Label className="grid gap-1 text-sm font-medium">
                  {t.fields.comment}
                  <Textarea className="min-h-28" defaultValue={preserve ? t.sample.comment : ''} disabled={liveState === 'loading'} name="comment" />
                </Label>

                <p className="rounded-sm bg-slate-100 px-3 py-2 text-sm text-slate-700">{t.privacy}</p>
                <Button className="focus:ring-2 focus:ring-ring" disabled={liveState === 'loading'} type="submit">
                  {liveState === 'loading' ? t.actions.submitting : t.actions.submit}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}

function PortalSurveyMessage({ locale, state }: { locale: PortalSurveyLocale; state?: PortalSurveyPreviewState | undefined }) {
  const t = portalSurveyText[locale];
  if (!state) return null;
  const successful = state === 'success';
  return (
    <p className={`rounded-md border px-4 py-3 text-sm font-medium ${successful ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-red-200 bg-red-50 text-red-800'}`} role={successful || state === 'loading' ? 'status' : 'alert'}>
      {t.states[state]}
    </p>
  );
}

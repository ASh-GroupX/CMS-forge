import React from 'react';
import { getStaffSessionPrincipal } from '../../../../lib/staff-session-api';
import { resolveLocale } from '../../../../i18n/staff-shell';
import { redirectComplaintsText } from '../../../../i18n/redirect-complaints';
import { loadRedirectChoices, loadRedirectDetail } from '../actions';
import { RedirectComplaintEditor } from '../../../../components/redirect-complaints/editor';
export const dynamic = 'force-dynamic';
export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams?: Promise<{ locale?: string }> }) {
  const { id } = await params; const locale = resolveLocale((await searchParams)?.locale);
  const [detail, choices, principal] = await Promise.all([loadRedirectDetail(id), loadRedirectChoices(), getStaffSessionPrincipal()]);
  if (detail.status !== 'ok') return <p role="alert">{redirectComplaintsText[locale][detail.status]}</p>;
  if (choices.status !== 'ok') return <p role="alert">{redirectComplaintsText[locale][choices.status]}</p>;
  return <RedirectComplaintEditor initial={detail.data} choices={choices.data} actorId={principal?.userId ?? ''} admin={principal?.roleCode === 'ADMIN'} locale={locale} />;
}

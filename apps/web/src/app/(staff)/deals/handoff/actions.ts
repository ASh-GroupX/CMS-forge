'use server';

import { redirect } from 'next/navigation';
import { advanceDeal, createDeal, updateDealBlocker } from '../../../../lib/staff-deals-api';

export async function createDealAction(formData: FormData): Promise<void> {
  const locale = safeLocale(formData.get('locale'));
  const ok = await createDeal({
    title: text(formData, 'title'),
    currentHolderId: text(formData, 'currentHolderId'),
    stageDueAt: text(formData, 'stageDueAt'),
    ...(optionalText(formData, 'branchId') ? { branchId: text(formData, 'branchId') } : {}),
    ...(optionalText(formData, 'blocker') ? { blocker: text(formData, 'blocker') } : {}),
  });
  redirect(`/deals/handoff?locale=${locale}&deal=${ok ? 'success' : 'error'}`);
}

export async function advanceDealAction(formData: FormData): Promise<void> {
  const locale = safeLocale(formData.get('locale'));
  const ok = await advanceDeal(text(formData, 'dealId'), {
    currentHolderId: text(formData, 'currentHolderId'),
    stageDueAt: text(formData, 'stageDueAt'),
  });
  redirect(`/deals/handoff?locale=${locale}&deal=${ok ? 'success' : 'error'}`);
}

export async function setDealBlockerAction(formData: FormData): Promise<void> {
  const locale = safeLocale(formData.get('locale'));
  const ok = await updateDealBlocker(text(formData, 'dealId'), optionalText(formData, 'blocker'));
  redirect(`/deals/handoff?locale=${locale}&deal=${ok ? 'success' : 'error'}`);
}

export async function clearDealBlockerAction(formData: FormData): Promise<void> {
  const locale = safeLocale(formData.get('locale'));
  const ok = await updateDealBlocker(text(formData, 'dealId'), null);
  redirect(`/deals/handoff?locale=${locale}&deal=${ok ? 'success' : 'error'}`);
}

function safeLocale(value: FormDataEntryValue | null): 'ar' | 'en' {
  return value === 'ar' ? 'ar' : 'en';
}

function optionalText(formData: FormData, name: string): string | null {
  const value = text(formData, name);
  return value ? value : null;
}

function text(formData: FormData, name: string): string {
  return String(formData.get(name) ?? '').trim();
}

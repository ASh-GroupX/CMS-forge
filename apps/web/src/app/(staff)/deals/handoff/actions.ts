'use server';

import { redirect } from 'next/navigation';
import { advanceDeal, createDeal, updateDealBlocker, updateDealDetails } from '../../../../lib/staff-deals-api';

export async function createDealAction(formData: FormData): Promise<void> {
  const locale = safeLocale(formData.get('locale'));
  const result = await createDeal({
    title: text(formData, 'title'),
    currentHolderId: text(formData, 'currentHolderId'),
    stageDueAt: text(formData, 'stageDueAt'),
    ...(optionalText(formData, 'branchId') ? { branchId: text(formData, 'branchId') } : {}),
    ...(optionalText(formData, 'blocker') ? { blocker: text(formData, 'blocker') } : {}),
  });
  redirect(`/deals/handoff?locale=${locale}&deal=${result}`);
}

export async function advanceDealAction(formData: FormData): Promise<void> {
  const locale = safeLocale(formData.get('locale'));
  const result = await advanceDeal(text(formData, 'dealId'), {
    currentHolderId: text(formData, 'currentHolderId'),
    stageDueAt: text(formData, 'stageDueAt'),
    updateNote: text(formData, 'updateNote'),
  });
  redirect(`/deals/handoff?locale=${locale}&deal=${result}`);
}

export async function setDealBlockerAction(formData: FormData): Promise<void> {
  const locale = safeLocale(formData.get('locale'));
  const result = await updateDealBlocker(text(formData, 'dealId'), { blocker: optionalText(formData, 'blocker'), updateNote: text(formData, 'updateNote') });
  redirect(`/deals/handoff?locale=${locale}&deal=${result}`);
}

export async function updateDealDetailsAction(formData: FormData): Promise<void> {
  const locale = safeLocale(formData.get('locale'));
  const result = await updateDealDetails(text(formData, 'dealId'), {
    currentHolderId: text(formData, 'currentHolderId'),
    stageDueAt: text(formData, 'stageDueAt'),
    updateNote: text(formData, 'updateNote'),
  });
  redirect(`/deals/handoff?locale=${locale}&deal=${result}`);
}

export async function clearDealBlockerAction(formData: FormData): Promise<void> {
  const locale = safeLocale(formData.get('locale'));
  const result = await updateDealBlocker(text(formData, 'dealId'), { blocker: null, updateNote: text(formData, 'updateNote') });
  redirect(`/deals/handoff?locale=${locale}&deal=${result}`);
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

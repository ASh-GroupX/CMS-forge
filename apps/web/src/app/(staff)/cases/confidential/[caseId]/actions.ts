'use server';

import { redirect } from 'next/navigation';
import { assignConfidentialCase } from '../../../../../lib/staff-confidential-cases-api';

export async function assignCaseAction(formData: FormData): Promise<void> {
  const caseId = text(formData, 'caseId');
  const locale = formData.get('locale') === 'ar' ? 'ar' : 'en';
  const result = await assignConfidentialCase(caseId, {
    assignedUserId: optionalText(formData, 'assignedUserId'),
    assignedDepartmentId: optionalText(formData, 'assignedDepartmentId'),
    reason: optionalText(formData, 'reason'),
  });
  redirect(`/cases/confidential/${encodeURIComponent(caseId)}?locale=${locale}&assignment=${result}`);
}

function optionalText(formData: FormData, name: string): string | null { return text(formData, name) || null; }
function text(formData: FormData, name: string): string { return String(formData.get(name) ?? '').trim(); }

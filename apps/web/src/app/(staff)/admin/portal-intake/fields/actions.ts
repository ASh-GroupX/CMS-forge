'use server';
import { cookies } from 'next/headers';
import type { PortalForm, PortalField } from '../../../../../../../../packages/contracts/src/portal-form';
import { intakeRequest } from '../../../../../lib/portal-intake-settings-api';
export async function loadPortalFields() { return intakeRequest<PortalForm>((await cookies()).toString(), '/fields'); }
export async function savePortalFields(input: { expectedVersion: number | null; fields: PortalField[] }) {
  const store = await cookies();
  return intakeRequest<PortalForm>(store.toString(), '/fields', input, store.get('cms_csrf_token')?.value);
}

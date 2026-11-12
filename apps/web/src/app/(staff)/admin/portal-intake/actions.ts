'use server';
import { cookies } from 'next/headers';
import { intakeRequest, type IntakeSetting, type IntakeOptions } from '../../../../lib/portal-intake-settings-api';
export async function loadIntakeSettings() {
  const cookie = (await cookies()).toString();
  const [settings, options] = await Promise.all([intakeRequest<IntakeSetting | null>(cookie), intakeRequest<IntakeOptions>(cookie, '/options')]);
  if (settings.status !== 'ok') return settings;
  if (options.status !== 'ok') return options;
  const portalUrl = new URL('/portal', process.env.PUBLIC_WEB_ORIGIN ?? 'https://cms.laith-alobaidi-crm.com').href;
  return { status: 'ok' as const, settings: settings.data, options: options.data, portalUrl };
}
export async function saveIntakeSettings(input: Omit<IntakeSetting, 'version'> & { expectedVersion: number | null }) {
  const store = await cookies();
  return intakeRequest<IntakeSetting>(store.toString(), '', input, store.get('cms_csrf_token')?.value);
}

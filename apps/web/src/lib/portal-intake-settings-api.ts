export type IntakeSetting = { branchId: string; categoryId: string; phoneCountryCode: string; version: number | null; memberIds: string[] };
export type IntakeOption = { id: string; nameEn: string; nameAr: string; branchId?: string | null; roleCode?: string };
export type IntakeOptions = { branches: IntakeOption[]; categories: IntakeOption[]; members: IntakeOption[] };
export type IntakeResult<T> = { status: 'ok'; data: T } | { status: 'error' | 'forbidden' | 'conflict' | 'validation' };
export async function intakeRequest<T>(cookie: string, path = '', input?: unknown, csrf?: string): Promise<IntakeResult<T>> {
  try {
    const response = await fetch(new URL(`/admin/portal-intake-settings${path}`, process.env.API_URL ?? 'http://localhost:3000'), {
      method: input === undefined ? 'GET' : 'PUT', cache: 'no-store',
      headers: { cookie, 'Content-Type': 'application/json', ...(csrf ? { 'x-csrf-token': csrf } : {}) },
      ...(input === undefined ? {} : { body: JSON.stringify(input) }),
    });
    if (!response.ok) return { status: response.status === 403 || response.status === 401 ? 'forbidden' : response.status === 409 ? 'conflict' : response.status === 400 ? 'validation' : 'error' };
    return { status: 'ok', data: await response.json() as T };
  } catch { return { status: 'error' }; }
}

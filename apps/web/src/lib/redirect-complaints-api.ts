import type { PortalField, BookingCarOption } from '../../../../packages/contracts/src/portal-form';
export type IntakeComplaint = { id: string; referenceNumber: string; expectedVersion: string; customerName: string; customerPhone: string; vehicleMake: string; vehicleModel: string; vehicleVin: string | null; odometer: number | null; incidentAt: string | null; descriptionEn: string; branchId: string; categoryId: string; severity: string; departmentId: string | null; ownerId: string | null; createdAt: string; status: string; portalData?: { fields: PortalField[]; values: Record<string, string | number | boolean | null>; originalValues: Record<string, string | number | boolean | null> } | null; claim: { assignedUserId: string | null; assignedUser?: { nameEn: string; nameAr: string } | null } | null };
export type IntakeChoices = { branches: Option[]; categories: Option[]; departments: Option[]; users: Option[]; severities: string[]; carModels?: BookingCarOption[]; suggestedDestination?: { branchId: string | null; departmentId: string | null } };
export type Option = { id: string; nameEn: string; nameAr: string; branchId?: string | null; departmentId?: string | null };
export type IntakeResponse<T> = { status: 'ok'; data: T } | { status: 'error' | 'forbidden' | 'conflict' | 'validation' | 'notFound' };
export async function redirectRequest<T>(cookie: string, path: string, method = 'GET', input?: unknown, csrf?: string): Promise<IntakeResponse<T>> {
  try {
    const response = await fetch(new URL(`/complaints/${path}`, process.env.API_URL ?? 'http://localhost:3000'), { method, cache: 'no-store', headers: { cookie, 'Content-Type': 'application/json', ...(csrf ? { 'x-csrf-token': csrf } : {}) }, ...(input === undefined ? {} : { body: JSON.stringify(input) }) });
    if (!response.ok) return { status: response.status === 401 || response.status === 403 ? 'forbidden' : response.status === 409 ? 'conflict' : response.status === 400 ? 'validation' : response.status === 404 ? 'notFound' : 'error' };
    return { status: 'ok', data: await response.json() as T };
  } catch { return { status: 'error' }; }
}

export class UpsertCarModelDto {
  id?: string | undefined;
  nameEn!: string;
  nameAr!: string;
  brand?: string | undefined;
  isActive?: boolean | undefined;
}

export function parseUpsertCarModelBody(input: unknown): UpsertCarModelDto {
  if (!input || typeof input !== 'object') throw new Error('Car model payload must be an object');
  const body = input as Record<string, unknown>;
  let nameEn = String(body.nameEn ?? '').trim();
  let nameAr = String(body.nameAr ?? '').trim();
  if (!nameEn && !nameAr) throw new Error('At least one of English or Arabic car model name is required');
  if (!nameEn) nameEn = nameAr;
  if (!nameAr) nameAr = nameEn;

  return {
    id: body.id ? String(body.id).trim() : undefined,
    nameEn,
    nameAr,
    brand: body.brand ? String(body.brand).trim() : 'Nissan',
    isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
  };
}

export class UpsertMaintenanceTypeDto {
  id?: string | undefined;
  nameEn!: string;
  nameAr!: string;
  estimatedDurationMinutes?: number | undefined;
  isActive?: boolean | undefined;
}

export function parseUpsertMaintenanceTypeBody(input: unknown): UpsertMaintenanceTypeDto {
  if (!input || typeof input !== 'object') throw new Error('Maintenance type payload must be an object');
  const body = input as Record<string, unknown>;
  let nameEn = String(body.nameEn ?? '').trim();
  let nameAr = String(body.nameAr ?? '').trim();
  if (!nameEn && !nameAr) throw new Error('At least one of English or Arabic maintenance type name is required');
  if (!nameEn) nameEn = nameAr;
  if (!nameAr) nameAr = nameEn;

  return {
    id: body.id ? String(body.id).trim() : undefined,
    nameEn,
    nameAr,
    estimatedDurationMinutes: Number(body.estimatedDurationMinutes) > 0 ? Number(body.estimatedDurationMinutes) : 30,
    isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
  };
}

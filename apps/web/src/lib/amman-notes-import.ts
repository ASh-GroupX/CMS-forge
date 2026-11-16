import type { CarModel, ServiceAppointment } from './staff-service-bookings-api';
import type { ServiceBookingLane } from './staff-service-booking-lanes-api';

export type AmmanImportRow = {
  sourceKey: string;
  date: string;
  hour: string;
  suggestedStart: string;
  customerName: string;
  customerPhone: string;
  carType: string;
  originalText: string;
};

export type ImportDecision = { row: AmmanImportRow; startTime?: string; reason?: string };
const MARKER = 'Amman Notes source: ';

export function parseAmmanNotesRows(value: unknown): AmmanImportRow[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > 500) throw new Error('Invalid Amman Notes file');
  const keys = new Set<string>();
  return value.map((item) => {
    if (!item || typeof item !== 'object') throw new Error('Invalid booking row');
    const row = item as Record<string, unknown>;
    const text = (key: keyof AmmanImportRow) => String(row[key] ?? '').trim();
    const result: AmmanImportRow = {
      sourceKey: text('sourceKey'), date: text('date'), hour: text('hour'),
      suggestedStart: text('suggestedStart'), customerName: text('customerName'),
      customerPhone: text('customerPhone'), carType: text('carType'), originalText: text('originalText'),
    };
    if (!/^2026-(11|12)-\d{2}-/.test(result.sourceKey) || keys.has(result.sourceKey)
      || !/^2026-(11|12)-\d{2}$/.test(result.date)
      || !/^\d{2}:00$/.test(result.hour)
      || !/^\d{2}:(00|15|30|45)$/.test(result.suggestedStart)
      || result.suggestedStart.slice(0, 2) !== result.hour.slice(0, 2)
      || !result.customerName || !/^07[789]\d{7}$/.test(result.customerPhone)
      || !result.carType || !result.originalText) throw new Error(`Invalid booking row: ${result.sourceKey || '?'}`);
    keys.add(result.sourceKey);
    return result;
  });
}

export function sourceMarker(key: string): string { return `${MARKER}${key}`; }

export function buildAmmanCustomerNotes(row: AmmanImportRow): string {
  return row.originalText;
}

export function findAmmanNotesToClean(rows: AmmanImportRow[], existing: ServiceAppointment[], laneId: string) {
  const byKey = new Map(rows.map((row) => [row.sourceKey, row]));
  return existing.flatMap((item) => {
    if (item.bookingLaneId !== laneId) return [];
    const key = item.notes.match(/^Amman Notes source: ([^\s]+)\n/)?.[1];
    const row = key ? byKey.get(key) : undefined;
    return row && item.date.slice(0, 10) === row.date && item.customerName === row.customerName
      && item.customerPhone === row.customerPhone && item.notes.endsWith(`Original source: ${row.originalText}`)
      ? [{ appointmentId: item.id, row }] : [];
  });
}

export function suggestCatalogModel(carType: string, models: CarModel[]): string {
  const alias: Record<string, string> = {
    Mage: 'Dongfeng Mage ICE', Nami: 'Dongfeng Nammi-01 EV 430 KM Plus CCC',
    Vigo: 'Dongfeng Nammi-06 VIGO EV 410 KM E1 GCC', Friday: 'Forthing Friday EV',
    A30: 'Dongfeng A30 Shine', Nano: 'Dongfeng Nano Box EV 351 KM CCC',
    'JAC E30X': 'E30X', EX1: 'Dongfeng Nano Box EX1 EV 330 KM CCC',
    E70: 'Dongfeng E70 EV 400 KM CCC', 'E70 Pro': 'Dongfeng E70 EV 400 KM CCC',
    S7: 'Forthing S7 EV 550 KM Standard CCC', Shine: 'Dongfeng A30 Shine',
    '007': 'Dongfeng E-PI 007 REV E1 GCC',
    '007 REEV': 'Dongfeng E-PI 007 REV E1 GCC',
    'S7 REEV': 'Forthing S7 REEV Exclusive GCC',
    'Mage HEV': 'Dongfeng Mage HEV E1 CCC',
    'T5 EVO': 'Forthing T5 EVO Gasoline Exclusive CCC',
    D60: 'Dongfeng D60 Qichen EV 405 KM Comfort CCC',
    AX7: 'Dongfeng AX7 Gasoline E1 CCC',
    IX7: 'DFSK Fengon Glory IX7 Gasoline CCC',
    Huge: 'Dongfeng Huge Gasoline E1 GCC',
    NS1: 'Honda NS1', ID4: 'ID.4', T5: 'Forthing T5 Hybrid Exclusive CCC',
    'BYD Seagull': 'seagull',
    Box: 'DFM BOX E3 EU', BJ30: 'BAIC BJ30e Hybrid GCC',
    'Song L': 'BYD Song L E1 EV CCC',
  };
  const exact = alias[carType];
  if (exact) return models.find((model) => model.isActive && model.nameEn === exact)?.id ?? '';
  const matches = models.filter((model) => model.isActive && model.nameEn.toLowerCase() === carType.toLowerCase());
  return matches.length === 1 ? matches[0]!.id : '';
}

export function planAmmanNotesImport(
  rows: AmmanImportRow[], existing: ServiceAppointment[], lane: ServiceBookingLane,
  modelByType: Record<string, string>,
): ImportDecision[] {
  const phoneKey = (value: string) => value.replace(/\D/g, '').slice(-9);
  const active = existing.filter((item) => item.bookingLaneId === lane.id && item.status !== 'CANCELLED' && item.status !== 'NO_SHOW');
  const byHour = new Map<string, number>();
  const bySlot = new Map<string, number>();
  const byDay = new Map<string, number>();
  const importedKeys = new Set<string>();
  for (const item of active) {
    const date = item.date.slice(0, 10);
    const hour = `${date}/${item.startTime.slice(0, 2)}`;
    const slot = `${date}/${item.startTime}`;
    byHour.set(hour, (byHour.get(hour) ?? 0) + 1);
    bySlot.set(slot, (bySlot.get(slot) ?? 0) + 1);
    byDay.set(date, (byDay.get(date) ?? 0) + 1);
    const marker = item.notes.match(/Amman Notes source: ([^\s]+)/)?.[1];
    if (marker) importedKeys.add(marker);
  }
  return rows.map((row) => {
    if (importedKeys.has(row.sourceKey)) return { row, reason: 'already-imported' };
    if (active.some((item) => item.date.slice(0, 10) === row.date && item.customerPhone === row.customerPhone
      && item.customerName === row.customerName && item.notes === row.originalText)) return { row, reason: 'already-imported' };
    if (active.some((item) => item.date.slice(0, 10) === row.date && phoneKey(item.customerPhone) === phoneKey(row.customerPhone)
      && item.startTime.slice(0, 2) === row.hour.slice(0, 2))) return { row, reason: 'possible-duplicate' };
    if (!modelByType[row.carType]) return { row, reason: 'model-unmapped' };
    const hourKey = `${row.date}/${row.hour.slice(0, 2)}`;
    if ((byDay.get(row.date) ?? 0) >= lane.maxDailyAppointments || (byHour.get(hourKey) ?? 0) >= lane.maxPerHour) {
      return { row, reason: 'capacity' };
    }
    const starts = [row.suggestedStart, ...['00', '15', '30', '45'].map((minutes) => `${row.hour.slice(0, 2)}:${minutes}`)];
    const startTime = starts.find((time) => (bySlot.get(`${row.date}/${time}`) ?? 0) < lane.maxPerSlot);
    if (!startTime) return { row, reason: 'capacity' };
    byDay.set(row.date, (byDay.get(row.date) ?? 0) + 1);
    byHour.set(hourKey, (byHour.get(hourKey) ?? 0) + 1);
    bySlot.set(`${row.date}/${startTime}`, (bySlot.get(`${row.date}/${startTime}`) ?? 0) + 1);
    return { row, startTime };
  });
}

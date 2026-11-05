export const STAFF_SESSION_PREFIX = 'cms:staff-work:';
const memory = new Map<string, unknown>();
const expiry = 2 * 60 * 60 * 1000;
export type StaffNavigationTrail = { entries: { id: string; href: string }[]; index: number };
export function sanitizeNavigationTrail(value: unknown): StaffNavigationTrail {
  const empty = { entries: [], index: 0 };
  if (!value || typeof value !== 'object') return empty;
  const record = value as Partial<StaffNavigationTrail>;
  if (!Array.isArray(record.entries) || !record.entries.every(entry => entry && typeof entry.id === 'string' && typeof entry.href === 'string' && entry.href.startsWith('/') && !entry.href.startsWith('//')) || !Number.isInteger(record.index) || record.index! < 0 || record.index! >= record.entries.length) return empty;
  return record as StaffNavigationTrail;
}
export function staffSessionKey(owner: string, kind: string): string { return `${STAFF_SESSION_PREFIX}${owner}:${kind}`; }
export function readStaffSession<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (raw) {
      const record = JSON.parse(raw) as { expires: number; value: T };
      if (record.expires > Date.now()) return record.value;
      sessionStorage.removeItem(key);
      memory.delete(key);
      return null;
    }
  } catch { /* In-memory continuity is still available within this page session. */ }
  return (memory.get(key) as T | undefined) ?? null;
}
export function writeStaffSession(key: string, value: unknown): boolean {
  memory.set(key, value);
  try { sessionStorage.setItem(key, JSON.stringify({ expires: Date.now() + expiry, value })); return true; }
  catch { return false; }
}
export function removeStaffSession(key: string): void {
  memory.delete(key);
  try { sessionStorage.removeItem(key); } catch { /* Storage may be disabled. */ }
}
export function clearStaffSession(): void {
  memory.clear();
  try { for (const key of Object.keys(sessionStorage)) if (key.startsWith(STAFF_SESSION_PREFIX)) sessionStorage.removeItem(key); } catch { /* Storage may be disabled. */ }
  window.dispatchEvent(new Event('cms:clear-draft-files'));
}
export function enterStaffSession(owner: string): void {
  try {
    const key = `${STAFF_SESSION_PREFIX}owner`;
    if (sessionStorage.getItem(key) !== owner) clearStaffSession();
    sessionStorage.setItem(key, owner);
  } catch { /* Do not block navigation when storage is unavailable. */ }
}
export function staffSectionHref(path: string, locale: string): string {
  const root = path.split('/')[1];
  const section = ['dashboard', 'admin', 'reports', 'complaints', 'internal-tickets', 'tasks', 'customers', 'audit', 'communication', 'notifications', 'service-booking', 'deals', 'cases'].includes(root ?? '') ? `/${root}` : '/dashboard';
  const valid = section === '/deals' ? '/deals/handoff' : section === '/cases' ? '/dashboard' : section;
  return `${valid}?locale=${locale === 'ar' ? 'ar' : 'en'}`;
}

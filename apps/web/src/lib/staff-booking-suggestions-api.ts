export type NextAvailableSlot = {
  branchId: string;
  branchNameEn: string;
  branchNameAr: string;
  date: string;
  time: string;
  bookedCount: number;
  maxPerSlot: number;
  remainingInSlot: number;
};

export async function fetchNextAvailableSlots(branchId: string, signal?: AbortSignal): Promise<NextAvailableSlot[]> {
  const base = process.env.NEXT_PUBLIC_API_URL || '/api';
  const query = new URLSearchParams({ branchId });
  const response = await fetch(`${base}/service-bookings/next-available?${query}`, {
    credentials: 'include', cache: 'no-store', ...(signal ? { signal } : {}),
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`Availability request failed (${response.status})`);
  const result: unknown = await response.json();
  if (!Array.isArray(result)) throw new Error('Invalid availability response');
  return result as NextAvailableSlot[];
}

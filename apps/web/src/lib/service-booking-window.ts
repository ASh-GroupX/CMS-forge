export type BookingWindow = { fromDate: string; toDate: string };

// Include the neighboring months so weeks crossing a month boundary are complete.
export function serviceBookingWindow(selectedDate: string): BookingWindow {
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(selectedDate) ? new Date(`${selectedDate}T00:00:00Z`) : new Date();
  const date = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  return {
    fromDate: new Date(Date.UTC(year, month - 1, 1)).toISOString().slice(0, 10),
    toDate: new Date(Date.UTC(year, month + 2, 0)).toISOString().slice(0, 10),
  };
}

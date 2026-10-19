export function periodToDateRange(
  period: string,
  customFrom?: string,
  customTo?: string,
): { dateFrom: string | null; dateTo: string | null } {
  if (!period || period === 'all' || period === 'all_time') {
    return { dateFrom: null, dateTo: null };
  }

  if (period === 'custom') {
    return {
      dateFrom: customFrom || null,
      dateTo: customTo || null,
    };
  }

  const now = new Date();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  if (period === 'today') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    return { dateFrom: start.toISOString(), dateTo: todayEnd.toISOString() };
  }

  if (period === 'yesterday') {
    const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
    const yesterdayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
    return { dateFrom: yesterdayStart.toISOString(), dateTo: yesterdayEnd.toISOString() };
  }

  if (period === 'this_week') {
    const start = new Date(now);
    const day = start.getDay();
    start.setDate(start.getDate() - day);
    start.setHours(0, 0, 0, 0);
    return { dateFrom: start.toISOString(), dateTo: todayEnd.toISOString() };
  }

  if (period === 'last_week') {
    const end = new Date(now);
    const day = end.getDay();
    end.setDate(end.getDate() - day - 1);
    end.setHours(23, 59, 59, 999);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return { dateFrom: start.toISOString(), dateTo: end.toISOString() };
  }

  if (period === 'this_month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    return { dateFrom: start.toISOString(), dateTo: todayEnd.toISOString() };
  }

  if (period === 'last_month') {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    return { dateFrom: start.toISOString(), dateTo: end.toISOString() };
  }

  if (period === 'last_30_days') {
    const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    start.setHours(0, 0, 0, 0);
    return { dateFrom: start.toISOString(), dateTo: todayEnd.toISOString() };
  }

  if (period === 'last_90_days') {
    const start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    start.setHours(0, 0, 0, 0);
    return { dateFrom: start.toISOString(), dateTo: todayEnd.toISOString() };
  }

  if (period === 'this_quarter') {
    const quarter = Math.floor(now.getMonth() / 3);
    const start = new Date(now.getFullYear(), quarter * 3, 1, 0, 0, 0, 0);
    return { dateFrom: start.toISOString(), dateTo: todayEnd.toISOString() };
  }

  if (period === 'this_year') {
    const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    return { dateFrom: start.toISOString(), dateTo: todayEnd.toISOString() };
  }

  return { dateFrom: null, dateTo: null };
}

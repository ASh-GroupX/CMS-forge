import { Injectable } from '@nestjs/common';
import { ServiceBookingsExportRepository } from './service-bookings.export.repository.js';

@Injectable()
export class ServiceBookingsExportService {
  constructor(private readonly repository: ServiceBookingsExportRepository) {}

  async exportPage(branchIds: string[] | null, limit: number, cursor?: string) {
    const rows = await this.repository.page(branchIds, limit, cursor);
    const items = rows.slice(0, limit);
    return { items, nextCursor: rows.length > limit ? items.at(-1)?.id ?? null : null };
  }
}

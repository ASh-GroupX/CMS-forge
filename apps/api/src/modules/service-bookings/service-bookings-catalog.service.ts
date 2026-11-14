import { DEFAULT_CAR_MODELS, DEFAULT_MAINTENANCE_TYPES } from './service-bookings.utils.js';
import type { ServiceBookingsRepository } from './service-bookings.repository.js';

export class ServiceBookingsCatalogService {
  constructor(protected readonly repository: ServiceBookingsRepository) {}

  async getServiceCenters(activeOnly = true) {
    const centers = await this.repository.listServiceCenters(activeOnly);
    if (centers.length === 0 && !activeOnly) {
      const defaults = [
        { id: 'center_main', code: 'MAIN_CENTER', nameEn: 'AMMAN Service Center', nameAr: 'مركز صيانة عمان', isActive: true },
        { id: 'center_north', code: 'NORTH_CENTER', nameEn: 'North Service Center', nameAr: 'مركز صيانة الشمال', isActive: true },
      ];
      await Promise.all(defaults.map((center) => this.repository.upsertServiceCenter(center).catch(() => null)));
      return this.repository.listServiceCenters(activeOnly);
    }
    return centers;
  }
  getActiveBookingLanes(serviceCenterId: string) { return this.repository.listActiveBookingLanes(serviceCenterId); }
  upsertServiceCenter(data: { id?: string | undefined; code?: string | undefined; nameEn: string; nameAr: string; address?: string | null | undefined; phone?: string | null | undefined; isActive?: boolean | undefined }) {
    return this.repository.upsertServiceCenter(data);
  }
  deleteServiceCenter(id: string) { return this.repository.deleteServiceCenter(id); }
  async getCarModels(activeOnly = true) {
    const models = await this.repository.listCarModels(activeOnly);
    if (models.length === 0 && !activeOnly) {
      await Promise.all(DEFAULT_CAR_MODELS.map((model) => this.repository.upsertCarModel(model).catch(() => null)));
      return this.repository.listCarModels(activeOnly);
    }
    return models;
  }
  upsertCarModel(data: { id?: string | undefined; nameEn: string; nameAr: string; brand?: string | undefined; isActive?: boolean | undefined }) { return this.repository.upsertCarModel(data); }
  deleteCarModel(id: string) { return this.repository.deleteCarModel(id); }
  async getMaintenanceTypes(activeOnly = true) {
    const types = await this.repository.listMaintenanceTypes(activeOnly);
    if (types.length === 0 && !activeOnly) {
      await Promise.all(DEFAULT_MAINTENANCE_TYPES.map((type) => this.repository.upsertMaintenanceType(type).catch(() => null)));
      return this.repository.listMaintenanceTypes(activeOnly);
    }
    return types;
  }
  upsertMaintenanceType(data: { id?: string | undefined; nameEn: string; nameAr: string; estimatedDurationMinutes?: number | undefined; isActive?: boolean | undefined }) { return this.repository.upsertMaintenanceType(data); }
  deleteMaintenanceType(id: string) { return this.repository.deleteMaintenanceType(id); }
}

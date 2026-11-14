import type { PrismaService } from '../../core/http-kernel.js';

export class ServiceBookingsCatalogRepository {
  constructor(protected readonly prisma: PrismaService) {}

  listCarModels(activeOnly = true) {
    return this.prisma.serviceCarModel.findMany({ where: activeOnly ? { isActive: true } : {}, orderBy: { nameEn: 'asc' } });
  }
  findCarModelById(id: string) { return this.prisma.serviceCarModel.findUnique({ where: { id } }); }
  async upsertCarModel(data: { id?: string | undefined; nameEn: string; nameAr: string; brand?: string | undefined; isActive?: boolean | undefined }) {
    if (data.id) return this.prisma.serviceCarModel.upsert({
      where: { id: data.id },
      update: { nameEn: data.nameEn, nameAr: data.nameAr, ...(data.brand ? { brand: data.brand } : {}), ...(data.isActive !== undefined ? { isActive: data.isActive } : {}) },
      create: { id: data.id, nameEn: data.nameEn, nameAr: data.nameAr, brand: data.brand || 'Nissan', isActive: data.isActive ?? true },
    });
    return this.prisma.serviceCarModel.create({ data: {
      nameEn: data.nameEn, nameAr: data.nameAr, brand: data.brand || 'Nissan', isActive: data.isActive ?? true,
    } });
  }
  listMaintenanceTypes(activeOnly = true) {
    return this.prisma.serviceMaintenanceType.findMany({ where: activeOnly ? { isActive: true } : {}, orderBy: { nameEn: 'asc' } });
  }
  findMaintenanceTypeById(id: string) { return this.prisma.serviceMaintenanceType.findUnique({ where: { id } }); }
  async upsertMaintenanceType(data: { id?: string | undefined; nameEn: string; nameAr: string; estimatedDurationMinutes?: number | undefined; isActive?: boolean | undefined }) {
    if (data.id) return this.prisma.serviceMaintenanceType.upsert({
      where: { id: data.id },
      update: { nameEn: data.nameEn, nameAr: data.nameAr, ...(data.estimatedDurationMinutes !== undefined ? { estimatedDurationMinutes: data.estimatedDurationMinutes } : {}), ...(data.isActive !== undefined ? { isActive: data.isActive } : {}) },
      create: { id: data.id, nameEn: data.nameEn, nameAr: data.nameAr, estimatedDurationMinutes: data.estimatedDurationMinutes || 60, isActive: data.isActive ?? true },
    });
    return this.prisma.serviceMaintenanceType.create({ data: {
      nameEn: data.nameEn, nameAr: data.nameAr, estimatedDurationMinutes: data.estimatedDurationMinutes || 60, isActive: data.isActive ?? true,
    } });
  }
  async deleteCarModel(id: string) {
    await this.prisma.serviceAppointment.updateMany({ where: { carModelId: id }, data: { carModelId: null } });
    return this.prisma.serviceCarModel.delete({ where: { id } });
  }
  async deleteMaintenanceType(id: string) {
    await this.prisma.serviceAppointment.updateMany({ where: { maintenanceTypeId: id }, data: { maintenanceTypeId: null } });
    return this.prisma.serviceMaintenanceType.delete({ where: { id } });
  }
}

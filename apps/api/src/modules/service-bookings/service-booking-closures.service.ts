import { HttpStatus, Injectable } from '@nestjs/common';
import type { StaffPrincipal } from '../../core/auth.guard.js';
import { AuditService } from '../../core/audit.service.js';
import { AppException } from '../../core/http-kernel.js';
import type { CreateServiceBookingClosureDto } from './dto/service-booking-closure.dto.js';
import { ServiceBookingClosuresRepository } from './service-booking-closures.repository.js';

@Injectable()
export class ServiceBookingClosuresService {
  constructor(private readonly repository: ServiceBookingClosuresRepository, private readonly audit: AuditService) {}

  async list(serviceCenterId: string, actor: StaffPrincipal) {
    this.requireAdmin(actor);
    await this.requireCenter(serviceCenterId);
    return this.repository.list(serviceCenterId);
  }

  async findActive(serviceCenterId: string, date: Date) {
    return this.repository.findActive(serviceCenterId, date);
  }

  async create(dto: CreateServiceBookingClosureDto, actor: StaffPrincipal) {
    this.requireAdmin(actor);
    return this.repository.transaction(async (client) => {
      await this.requireCenter(dto.serviceCenterId, client);
      const startDate = new Date(`${dto.startDate}T00:00:00Z`);
      const endDate = new Date(`${dto.endDate}T00:00:00Z`);
      if (await this.repository.findOverlap(dto.serviceCenterId, startDate, endDate, client)) {
        throw new AppException('CONFLICT', 'Date range overlaps an existing booking closure', HttpStatus.CONFLICT);
      }
      const closure = await this.repository.create({ serviceCenterId: dto.serviceCenterId,
        startDate, endDate, reason: dto.reason, createdById: actor.userId }, client);
      await this.audit.record({ eventType: 'CONFIG', action: 'service_booking_closure_created',
        actorId: actor.userId, branchId: actor.branchId, targetType: 'ServiceBookingClosure', targetId: closure.id,
        metadata: { serviceCenterId: dto.serviceCenterId, startDate: dto.startDate, endDate: dto.endDate, reason: dto.reason },
      }, client);
      return closure;
    });
  }

  async delete(serviceCenterId: string, id: string, actor: StaffPrincipal) {
    this.requireAdmin(actor);
    return this.repository.transaction(async (client) => {
      const closure = await this.repository.findById(id, client);
      if (!closure || closure.serviceCenterId !== serviceCenterId) {
        throw new AppException('VALIDATION_FAILED', 'Unknown booking closure', HttpStatus.BAD_REQUEST);
      }
      await this.repository.delete(id, client);
      await this.audit.record({ eventType: 'CONFIG', action: 'service_booking_closure_deleted',
        actorId: actor.userId, branchId: actor.branchId, targetType: 'ServiceBookingClosure', targetId: id,
        metadata: { serviceCenterId, startDate: closure.startDate.toISOString().slice(0, 10),
          endDate: closure.endDate.toISOString().slice(0, 10), reason: closure.reason },
      }, client);
      return { id };
    });
  }

  private requireAdmin(actor: StaffPrincipal) {
    if (actor.roleCode !== 'ADMIN') throw new AppException('RBAC_FORBIDDEN', 'Forbidden', HttpStatus.FORBIDDEN);
  }

  private async requireCenter(serviceCenterId: string, client?: Parameters<ServiceBookingClosuresRepository['findCenter']>[1]) {
    if (!await this.repository.findCenter(serviceCenterId, client)) {
      throw new AppException('VALIDATION_FAILED', 'Unknown service center', HttpStatus.BAD_REQUEST);
    }
  }
}

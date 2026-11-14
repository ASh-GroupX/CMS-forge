import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { StaffPrincipal } from '../../core/auth.guard.js';
import { AuditService } from '../../core/audit.service.js';
import { AppException } from '../../core/http-kernel.js';
import type { UpsertServiceBookingLaneDto } from './dto/service-booking-lane.dto.js';
import { ServiceBookingLanesRepository } from './service-booking-lanes.repository.js';

@Injectable()
export class ServiceBookingLanesService {
  constructor(
    private readonly repository: ServiceBookingLanesRepository,
    private readonly audit: AuditService,
  ) {}

  list(serviceCenterId: string, includeInactive: boolean, actor: StaffPrincipal) {
    if (includeInactive && actor.roleCode !== 'ADMIN') forbidden();
    return this.repository.list(serviceCenterId, !includeInactive);
  }

  async upsert(dto: UpsertServiceBookingLaneDto, actor: StaffPrincipal) {
    if (actor.roleCode !== 'ADMIN') forbidden();
    try {
      return await this.repository.transaction(async (client) => {
      const center = await this.repository.findCenter(dto.serviceCenterId, client);
      if (!center) throw new AppException('VALIDATION_FAILED', 'Unknown service center', HttpStatus.BAD_REQUEST);

      const values = {
        serviceCenterId: dto.serviceCenterId,
        code: dto.code,
        nameEn: dto.nameEn,
        nameAr: dto.nameAr,
        maxDailyAppointments: dto.maxDailyAppointments,
        maxPerHour: dto.maxPerHour,
        maxPerSlot: dto.maxPerSlot,
        position: dto.position,
        isActive: dto.isActive,
      };

      let lane;
      let action: 'service_booking_lane_created' | 'service_booking_lane_updated';
      if (dto.id) {
        const existing = await this.repository.findLane(dto.id, client);
        if (!existing || existing.serviceCenterId !== dto.serviceCenterId) {
          throw new AppException('VALIDATION_FAILED', 'Unknown booking lane', HttpStatus.BAD_REQUEST);
        }
        if (!dto.expectedUpdatedAt) conflict();
        lane = await this.repository.update(dto.id, new Date(dto.expectedUpdatedAt), values, client);
        if (!lane) conflict();
        action = 'service_booking_lane_updated';
      } else {
        lane = await this.repository.create(values, client);
        action = 'service_booking_lane_created';
      }

      await this.audit.record({
        eventType: 'CONFIG', action, actorId: actor.userId, branchId: actor.branchId,
        targetType: 'ServiceBookingLane', targetId: lane.id,
        metadata: { serviceCenterId: lane.serviceCenterId, code: lane.code, isActive: lane.isActive,
          maxDailyAppointments: lane.maxDailyAppointments, maxPerHour: lane.maxPerHour, maxPerSlot: lane.maxPerSlot },
      }, client);
      return lane;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new AppException('VALIDATION_FAILED', 'A booking lane with this code already exists in the service center', HttpStatus.BAD_REQUEST);
      }
      throw error;
    }
  }
}

function forbidden(): never {
  throw new AppException('RBAC_FORBIDDEN', 'Forbidden', HttpStatus.FORBIDDEN);
}

function conflict(): never {
  throw new AppException('CONFLICT', 'Booking lane changed. Reload and retry.', HttpStatus.CONFLICT);
}

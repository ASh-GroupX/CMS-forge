import { Module } from '@nestjs/common';
import { ServiceBookingsController } from './service-bookings.controller.js';
import { ServiceBookingsRepository } from './service-bookings.repository.js';
import { ServiceBookingsService } from './service-bookings.service.js';

@Module({
  controllers: [ServiceBookingsController],
  providers: [ServiceBookingsRepository, ServiceBookingsService],
  exports: [ServiceBookingsService],
})
export class ServiceBookingsModule {}

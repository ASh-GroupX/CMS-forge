import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/http-kernel.js';
import { appointmentSelect } from './service-bookings.repository.js';

@Injectable()
export class ServiceBookingSmsReminderRepository {
  constructor(private readonly prisma: PrismaService) {}

  findUpcomingAppointments(now: Date) {
    const startOfDay = new Date(`${now.toISOString().slice(0, 10)}T00:00:00.000Z`);
    return this.prisma.serviceAppointment.findMany({
      where: { date: { gte: startOfDay }, status: { in: ['BOOKED', 'CONFIRMED'] } },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      select: appointmentSelect,
    });
  }
}

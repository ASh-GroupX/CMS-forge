import { Injectable } from '@nestjs/common';
import { NotificationChannel, NotificationStatus } from '@prisma/client';
import { PrismaService } from '../../core/http-kernel.js';

@Injectable()
export class NotificationScheduleRepository {
  constructor(private readonly prisma: PrismaService) {}

  listRecentServiceBookingSms() {
    return this.prisma.notification.findMany({
      where: { templateCode: 'service_booking.reminder', serviceAppointmentId: { not: null } },
      orderBy: { queuedAt: 'desc' }, take: 5,
      select: { id: true, status: true, scheduledAt: true, sentAt: true, serviceAppointment: { select: { referenceNumber: true } } },
    });
  }

  async cancelQueuedServiceBookingSms(appointmentId: string): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: { serviceAppointmentId: appointmentId, channel: NotificationChannel.SMS, status: NotificationStatus.QUEUED, templateCode: 'service_booking.reminder' },
      data: { status: NotificationStatus.CANCELLED },
    });
    return result.count;
  }

  async cancelAllQueuedServiceBookingSms(): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: { channel: NotificationChannel.SMS, status: NotificationStatus.QUEUED, templateCode: 'service_booking.reminder' },
      data: { status: NotificationStatus.CANCELLED },
    });
    return result.count;
  }
}

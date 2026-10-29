import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/http-kernel.js';

export type BookingPermissionKey =
  | 'canViewBookings'
  | 'canCreateBookings'
  | 'canRescheduleBookings'
  | 'canChangeStatus'
  | 'canCancelBookings'
  | 'canManageSettings';

const PERMISSION_MESSAGES: Record<BookingPermissionKey, { en: string; ar: string }> = {
  canViewBookings: { en: 'You do not have permission to view service bookings', ar: 'ليس لديك صلاحية عرض حجوزات الصيانة' },
  canCreateBookings: { en: 'You do not have permission to book appointments', ar: 'ليس لديك صلاحية حجز موعد جديد' },
  canRescheduleBookings: { en: 'You do not have permission to reschedule appointments', ar: 'ليس لديك صلاحية إعادة جدولة المواعيد' },
  canChangeStatus: { en: 'You do not have permission to change appointment status', ar: 'ليس لديك صلاحية تغيير حالة الموعد' },
  canCancelBookings: { en: 'You do not have permission to cancel appointments', ar: 'ليس لديك صلاحية إلغاء الموعد' },
  canManageSettings: { en: 'You do not have permission to manage booking settings', ar: 'ليس لديك صلاحية إدارة إعدادات الحجز' },
};

@Injectable()
export class UserBookingRulesService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserBookingRule(userId: string, roleCode?: string) {
    const rule = await this.prisma.userBookingRule.findUnique({ where: { userId } });
    if (rule) return rule;

    const isAdmin = roleCode === 'ADMIN';
    return {
      userId,
      canViewBookings: true,
      canCreateBookings: true,
      canRescheduleBookings: true,
      canChangeStatus: true,
      canCancelBookings: true,
      canManageSettings: isAdmin,
    };
  }

  async checkPermission(userId: string | null | undefined, roleCode: string | undefined, key: BookingPermissionKey): Promise<void> {
    if (!userId) return;
    if (roleCode === 'ADMIN') return;

    const rule = await this.getUserBookingRule(userId, roleCode);
    if (!rule[key]) {
      const msg = `${PERMISSION_MESSAGES[key].en} / ${PERMISSION_MESSAGES[key].ar}`;
      throw new ForbiddenException(msg);
    }
  }

  async updateUserBookingRule(userId: string, dto: any, principal: any) {
    await this.checkPermission(principal.userId, principal.roleCode, 'canManageSettings');

    return this.prisma.userBookingRule.upsert({
      where: { userId },
      create: {
        userId,
        canViewBookings: dto.canViewBookings ?? true,
        canCreateBookings: dto.canCreateBookings ?? true,
        canRescheduleBookings: dto.canRescheduleBookings ?? true,
        canChangeStatus: dto.canChangeStatus ?? true,
        canCancelBookings: dto.canCancelBookings ?? true,
        canManageSettings: Boolean(dto.canManageSettings),
      },
      update: {
        canViewBookings: dto.canViewBookings !== undefined ? Boolean(dto.canViewBookings) : true,
        canCreateBookings: dto.canCreateBookings !== undefined ? Boolean(dto.canCreateBookings) : true,
        canRescheduleBookings: dto.canRescheduleBookings !== undefined ? Boolean(dto.canRescheduleBookings) : true,
        canChangeStatus: dto.canChangeStatus !== undefined ? Boolean(dto.canChangeStatus) : true,
        canCancelBookings: dto.canCancelBookings !== undefined ? Boolean(dto.canCancelBookings) : true,
        canManageSettings: dto.canManageSettings !== undefined ? Boolean(dto.canManageSettings) : false,
      },
    });
  }

  async getAllUsersBookingRules(principal: any) {
    await this.checkPermission(principal.userId, principal.roleCode, 'canManageSettings');

    return this.prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        nameEn: true,
        nameAr: true,
        username: true,
        email: true,
        role: { select: { code: true, nameEn: true, nameAr: true } },
        department: { select: { id: true, nameEn: true, nameAr: true } },
        bookingRule: true,
      },
      orderBy: [{ departmentId: 'asc' }, { nameEn: 'asc' }],
    });
  }
}

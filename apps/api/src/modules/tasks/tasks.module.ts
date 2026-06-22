import { Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuditService } from '../../core/audit.service.js';
import { RbacGuard, SESSION_AUTH_SERVICE, SessionAuthGuard } from '../../core/auth.guard.js';
import { CsrfGuard } from '../../core/csrf.guard.js';
import { PrismaService } from '../../core/http-kernel.js';
import { AuthModule } from '../auth/auth.module.js';
import { AuthService } from '../auth/auth.service.js';
import { AdminModule } from '../admin/admin.module.js';
import { AdminUsersService } from '../admin/admin-users.service.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { TasksController } from './tasks.controller.js';
import { TasksRelatedRecordsService } from './tasks.related-records.service.js';
import { TasksRepository } from './tasks.repository.js';
import { TasksService } from './tasks.service.js';

@Module({
  imports: [AuthModule, AdminModule, NotificationsModule],
  controllers: [TasksController],
  providers: [
    PrismaService,
    {
      provide: AuditService,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new AuditService(prisma),
    },
    {
      provide: TasksRepository,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new TasksRepository(prisma),
    },
    {
      provide: TasksRelatedRecordsService,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new TasksRelatedRecordsService(prisma),
    },
    {
      provide: TasksService,
      inject: [TasksRepository, AuditService, NotificationsService, AdminUsersService, TasksRelatedRecordsService],
      useFactory: (repository: TasksRepository, audit: AuditService, notifications: NotificationsService, users: AdminUsersService, relatedRecords: TasksRelatedRecordsService) => new TasksService(repository, audit, notifications, users, relatedRecords),
    },
    {
      provide: SESSION_AUTH_SERVICE,
      inject: [AuthService],
      useFactory: (authService: AuthService) => authService,
    },
    SessionAuthGuard,
    {
      provide: RbacGuard,
      inject: [Reflector, AuditService],
      useFactory: (reflector: Reflector, audit: AuditService) => new RbacGuard(reflector, audit),
    },
    CsrfGuard,
  ],
  exports: [TasksService],
})
export class TasksModule {}

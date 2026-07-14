import { Module } from '@nestjs/common';
import { AuditService } from '../../core/audit.service.js';
import { PermissionGuard, SESSION_AUTH_SERVICE, SessionAuthGuard } from '../../core/auth.guard.js';
import { CsrfGuard } from '../../core/csrf.guard.js';
import { PrismaService } from '../../core/http-kernel.js';
import { AuthModule } from '../auth/auth.module.js';
import { AuthService } from '../auth/auth.service.js';
import { TasksModule } from '../tasks/tasks.module.js';
import { TasksBoardService } from '../tasks/tasks.board.service.js';
import { BoardStagesController } from './board-stages.controller.js';
import { BoardStagesRepository } from './board-stages.repository.js';
import { BoardStagesService } from './board-stages.service.js';

@Module({
  imports: [AuthModule, TasksModule],
  controllers: [BoardStagesController],
  providers: [
    PrismaService,
    AuditService,
    BoardStagesRepository,
    {
      provide: BoardStagesService,
      inject: [BoardStagesRepository, AuditService, TasksBoardService],
      useFactory: (repository: BoardStagesRepository, audit: AuditService, tasksBoard: TasksBoardService) =>
        new BoardStagesService(repository, audit, tasksBoard),
    },
    {
      provide: SESSION_AUTH_SERVICE,
      inject: [AuthService],
      useFactory: (authService: AuthService) => authService,
    },
    SessionAuthGuard,
    PermissionGuard,
    CsrfGuard,
  ],
  exports: [BoardStagesService],
})
export class BoardStagesModule {}

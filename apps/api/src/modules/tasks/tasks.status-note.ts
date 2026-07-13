import { HttpStatus } from '@nestjs/common';
import { TaskStatus } from '@prisma/client';
import { AppException } from '../../core/http-kernel.js';

export function requiredStatusNote(fromStatus: TaskStatus, toStatus: TaskStatus, note: string | undefined): string | null {
  if (fromStatus === toStatus || (toStatus !== TaskStatus.DONE && toStatus !== TaskStatus.WAITING)) return optionalText(note);
  const text = optionalText(note);
  if (text) return text;
  throw new AppException('TASK_STATUS_NOTE_REQUIRED', 'Done and waiting task updates require an outcome note', HttpStatus.BAD_REQUEST, [
    { field: 'statusNote', code: 'REQUIRED', message: 'statusNote is required for done or waiting updates.' },
  ]);
}

export function statusComment(fromStatus: TaskStatus, toStatus: TaskStatus, note: string): string {
  return `Status update ${fromStatus} -> ${toStatus}: ${note}`;
}

function optionalText(value: string | null | undefined): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

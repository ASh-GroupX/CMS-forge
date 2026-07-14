'use server';

import { revalidatePath } from 'next/cache';
import { moveTaskCard, type MoveTaskCardPayload, type MoveTaskCardResult } from '../../../../lib/staff-board-api';

export async function moveTaskCardAction(taskId: string, payload: MoveTaskCardPayload): Promise<MoveTaskCardResult> {
  const result = await moveTaskCard(taskId, payload);
  if (result.status === 'success') revalidatePath('/tasks/board');
  return result;
}

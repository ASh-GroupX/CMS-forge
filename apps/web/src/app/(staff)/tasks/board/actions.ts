'use server';

import { revalidatePath } from 'next/cache';
import {
  assignTaskDepartment,
  moveTaskCard,
  type AssignTaskDepartmentResult,
  type MoveTaskCardPayload,
  type MoveTaskCardResult,
} from '../../../../lib/staff-board-api';
import {
  archiveBoardStage,
  createBoardStage,
  reorderBoardStages,
  updateBoardStage,
  type BoardStageScope,
  type CreateStagePayload,
  type StageWriteResult,
  type UpdateStagePayload,
} from '../../../../lib/staff-board-stages-api';

export async function moveTaskCardAction(taskId: string, payload: MoveTaskCardPayload): Promise<MoveTaskCardResult> {
  const result = await moveTaskCard(taskId, payload);
  if (result.status === 'success') revalidatePath('/tasks/board');
  return result;
}

export async function assignTaskDepartmentAction(taskId: string, departmentId: string | null): Promise<AssignTaskDepartmentResult> {
  const result = await assignTaskDepartment(taskId, departmentId);
  if (result.status === 'success') revalidatePath('/tasks/board');
  return result;
}

export async function createBoardStageAction(payload: CreateStagePayload): Promise<StageWriteResult> {
  return refreshOnSuccess(await createBoardStage(payload));
}

export async function updateBoardStageAction(id: string, payload: UpdateStagePayload): Promise<StageWriteResult> {
  return refreshOnSuccess(await updateBoardStage(id, payload));
}

export async function reorderBoardStagesAction(scope: BoardStageScope, orderedIds: string[]): Promise<StageWriteResult> {
  return refreshOnSuccess(await reorderBoardStages(scope, orderedIds));
}

export async function archiveBoardStageAction(id: string, destinationStageId: string): Promise<StageWriteResult> {
  return refreshOnSuccess(await archiveBoardStage(id, destinationStageId));
}

function refreshOnSuccess(result: StageWriteResult): StageWriteResult {
  if (result.status === 'success') revalidatePath('/tasks/board');
  return result;
}

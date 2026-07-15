import React from 'react';
import { TaskBoardScreen } from '../../../../components/task-board';
import { StageManager } from '../../../../components/task-board/stage-manager';
import { resolveLocale } from '../../../../i18n/staff-shell';
import { getTaskBoardLoadResult } from '../../../../lib/staff-board-api';
import { getStaffSessionPrincipal } from '../../../../lib/staff-session-api';
import {
  archiveBoardStageAction,
  assignTaskDepartmentAction,
  createBoardStageAction,
  moveTaskCardAction,
  reorderBoardStagesAction,
  updateBoardStageAction,
} from './actions';

type SearchParams = { locale?: string | string[] };

export default async function TaskBoardPage({
  cookieHeader,
  fetchImpl,
  searchParams,
}: {
  cookieHeader?: string;
  fetchImpl?: typeof fetch;
  searchParams?: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const locale = resolveLocale(params?.locale);
  const apiInput = {
    ...(cookieHeader !== undefined ? { cookieHeader } : {}),
    ...(fetchImpl !== undefined ? { fetchImpl } : {}),
  };
  const [result, principal] = await Promise.all([getTaskBoardLoadResult(apiInput), getStaffSessionPrincipal(apiInput)]);
  const canManageStages = principal?.permissions.includes('MASTER_DATA_MANAGE') ?? false;
  return (
    <TaskBoardScreen
      assignDepartmentAction={assignTaskDepartmentAction}
      board={result.status === 'ready' ? result.data : null}
      locale={locale}
      moveAction={moveTaskCardAction}
      stageManager={canManageStages && result.status === 'ready' ? (
        <StageManager
          actions={{
            archive: archiveBoardStageAction,
            create: createBoardStageAction,
            reorder: reorderBoardStagesAction,
            update: updateBoardStageAction,
          }}
          locale={locale}
          stages={result.data.stages}
        />
      ) : undefined}
      state={result.status === 'ready' ? undefined : result.status}
    />
  );
}

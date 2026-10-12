'use server';

import { revalidatePath } from 'next/cache';
import {
  transitionComplaint,
  type ComplaintTransitionPayload,
  type TransitionComplaintResult,
} from '../../../../../lib/staff-complaint-board-api';
import { getComplaintCardDetail, type ComplaintCardDetail } from '../../../../../lib/staff-complaint-board-detail-api';

export async function transitionComplaintAction(complaintId: string, payload: ComplaintTransitionPayload): Promise<TransitionComplaintResult> {
  const result = await transitionComplaint(complaintId, payload);
  if (result.status === 'success' || result.status === 'conflict' || result.status === 'error') revalidatePath('/complaints/board');
  return result;
}

export async function complaintCardDetailAction(complaintId: string): Promise<ComplaintCardDetail> {
  return getComplaintCardDetail(complaintId);
}

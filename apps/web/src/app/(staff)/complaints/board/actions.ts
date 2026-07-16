'use server';

import { revalidatePath } from 'next/cache';
import {
  transitionComplaint,
  type ComplaintTransitionPayload,
  type TransitionComplaintResult,
} from '../../../../lib/staff-complaint-board-api';
import { getComplaintCardDetail, type ComplaintCardDetail } from '../../../../lib/staff-complaint-board-detail-api';

export async function transitionComplaintAction(complaintId: string, payload: ComplaintTransitionPayload): Promise<TransitionComplaintResult> {
  const result = await transitionComplaint(complaintId, payload);
  // Refresh the board on any outcome that may have changed server state: success,
  // a stale conflict, or an error (the backend can commit a transition and still
  // 5xx on a post-commit side effect — the board then self-heals to server truth
  // instead of showing a stale card). denied/not_found/invalid never mutate.
  if (result.status === 'success' || result.status === 'conflict' || result.status === 'error') revalidatePath('/complaints/board');
  return result;
}

// Read-only fetch-on-open for the ticket quick-look drawer (B6). No revalidation —
// it never mutates; the forwarded session scopes what the timeline returns.
export async function complaintCardDetailAction(complaintId: string): Promise<ComplaintCardDetail> {
  return getComplaintCardDetail(complaintId);
}

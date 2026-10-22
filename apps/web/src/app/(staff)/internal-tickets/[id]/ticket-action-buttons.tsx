'use client';

import React, { useState } from 'react';
import { UserPlus, Send, X, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { transferTicket, assignTicket, acceptTicket, waitTicket, approveTicket, rejectTicket, resolveTicket, approveRequestTicket, assignToTeamTicket, deleteTicketAction, resubmitTicket } from '../../../../lib/staff-internal-tickets-actions';
import { useRouter } from 'next/navigation';

export function TicketActionButtons({ 
  ticket, 
  options, 
  principal, 
  locale = 'en' 
}: { 
  ticket: any; 
  options?: any; 
  principal?: any; 
  locale?: string; 
}) {
  const router = useRouter();
  const isAr = locale === 'ar';
  const ticketId = ticket.id;
  
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isWaitOpen, setIsWaitOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isResubmitOpen, setIsResubmitOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Transfer form state
  const [targetDepartmentId, setTargetDepartmentId] = useState('');
  const [reason, setReason] = useState('');

  // Assign form state
  const [employeeId, setEmployeeId] = useState('');

  // Wait / Reject / Approve / Resolve state
  const [waitingReasonId, setWaitingReasonId] = useState('');
  const [customWaitingReason, setCustomWaitingReason] = useState('');
  
  const [isResolveOpen, setIsResolveOpen] = useState(false);
  const [resolutionReasonId, setResolutionReasonId] = useState('');
  const [resolutionDetails, setResolutionDetails] = useState('');

  const [rejectReasonId, setRejectReasonId] = useState('');
  const [rejectDetails, setRejectDetails] = useState('');
  
  const [resubmitReason, setResubmitReason] = useState('');
  
  const [rating, setRating] = useState<number>(5);
  const [approveFeedback, setApproveFeedback] = useState('');

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) return toast.error('Rating is required');

    setLoading(true);
    try {
      await approveTicket(ticketId, { rating, feedback: approveFeedback });
      toast.success('Ticket approved & closed');
      setIsApproveOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetDepartmentId) return toast.error('Target Department is required');
    if (!reason) return toast.error('Reason is required');

    setLoading(true);
    try {
      await transferTicket(ticketId, { targetDepartmentId, reason });
      toast.success('Ticket transferred successfully');
      setIsTransferOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to transfer ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId) return toast.error('Employee ID is required');

    setLoading(true);
    try {
      await assignTicket(ticketId, employeeId);
      toast.success('Ticket assigned successfully');
      setIsAssignOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to assign ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleWait = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitingReasonId) return toast.error('Reason is required');

    setLoading(true);
    try {
      await waitTicket(ticketId, { waitingReasonId, customWaitingReason });
      toast.success('Ticket on wait');
      setIsWaitOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolutionReasonId) return toast.error('Resolution subject is required');
    if (!resolutionDetails) return toast.error('Description of what you did is required');

    setLoading(true);
    try {
      await resolveTicket(ticketId, { resolutionReasonId, resolutionDetails });
      toast.success('Ticket marked as resolved');
      setIsResolveOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to resolve ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReasonId) return toast.error('Reason is required');

    setLoading(true);
    try {
      await rejectTicket(ticketId, { rejectReasonId, rejectDetails });
      toast.success('Ticket rejected');
      setIsRejectOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to completely delete this ticket? This action cannot be undone.')) return;
    setLoading(true);
    try {
      await deleteTicketAction(ticketId);
      toast.success('Ticket deleted');
      router.push('/internal-tickets');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete ticket');
      setLoading(false);
    }
  };

  const handleResubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resubmitReason) return toast.error('Please provide a reason or description of the fix');
    setLoading(true);
    try {
      await resubmitTicket(ticketId, resubmitReason);
      toast.success('Ticket resubmitted successfully');
      setIsResubmitOpen(false);
      router.refresh();
      setTimeout(() => window.location.reload(), 500); // Fallback for Next.js cache
    } catch(err: any) {
      toast.error(err.message || 'Failed to resubmit ticket');
    } finally {
      setLoading(false);
    }
  };

  // RBAC checks
  const isManager = principal?.roleCode === 'BRANCH_MANAGER' || principal?.roleCode === 'DEPARTMENT_MANGER' || principal?.roleCode === 'DEPARTMENT_MANAGER' || principal?.roleCode === 'CR_MANAGER';
  const isAssignedOfficer = principal?.userId === ticket.assignedEmployeeId;
  const isTargetDepartment = Boolean(principal?.departmentId && principal?.departmentId === ticket.targetDepartmentId);
  const isRequester = principal?.userId === ticket.requestedById || Boolean(principal?.departmentId && principal?.departmentId === ticket.requestedBy?.departmentId);
  const isAdmin = principal?.roleCode === 'ADMIN';

  // Filter reasons strictly by department
  const isPendingApproval = ticket.status === 'PENDING_APPROVAL';
  const targetDeptId = ticket.targetDepartmentId;
  const requesterDeptId = ticket.requestedBy?.departmentId || principal?.departmentId;

  // Waiting reasons belong to the target department handling the ticket
  const departmentWaitingReasons = (options?.waitingReasons || []).filter(
    (r: any) => r.departmentId === targetDeptId
  );

  // Resolution reasons belong to the target department handling the ticket
  const departmentResolutionReasons = (options?.resolutionReasons || []).filter(
    (r: any) => r.departmentId === targetDeptId
  );

  // Reject reasons: if rejecting a pending approval request, prioritize requester's department reasons;
  // otherwise prioritize target department reasons
  const preferredRejectDeptId = isPendingApproval ? requesterDeptId : targetDeptId;
  let departmentRejectReasons = (options?.rejectReasons || []).filter(
    (r: any) => r.departmentId === preferredRejectDeptId
  );
  if (departmentRejectReasons.length === 0) {
    const fallbackRejectDeptId = isPendingApproval ? targetDeptId : requesterDeptId;
    departmentRejectReasons = (options?.rejectReasons || []).filter(
      (r: any) => r.departmentId === fallbackRejectDeptId
    );
  }

  return (
    <>
      <div className="flex gap-2">
        {/* Admin Actions */}
        {isAdmin && (
          <button onClick={handleDelete} disabled={loading} className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 px-3 py-1.5 text-sm font-bold hover:bg-red-100 transition-colors mr-2">
            <Trash2 className="size-4" /> Delete
          </button>
        )}

        {/* Manager Actions (Pending Approval) */}
        {isManager && ticket.status === 'PENDING_APPROVAL' && ticket.requestedBy?.departmentId === principal?.departmentId && (
          <>
            <button onClick={() => setIsRejectOpen(true)} className="flex items-center gap-1.5 rounded-lg bg-red-500 text-white px-3 py-1.5 text-sm font-bold hover:bg-red-600">
              Reject Request
            </button>
            <button onClick={async () => {
              try { await approveRequestTicket(ticketId); toast.success('Request approved & sent'); } catch(e: any) { toast.error(e.message); }
            }} className="flex items-center gap-1.5 rounded-lg bg-brand text-white px-3 py-1.5 text-sm font-bold hover:bg-brand-hover">
              Approve to Send
            </button>
          </>
        )}

        {/* Manager Actions: NEW ticket arrives at their department — assign or send to team */}
        {isManager && isTargetDepartment && ticket.status === 'NEW' && (
          <>
            <button 
              onClick={() => setIsAssignOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-line-subtle bg-surface px-3 py-1.5 text-sm font-semibold hover:bg-surface-canvas"
            >
              <UserPlus className="size-4" /> Assign to Employee
            </button>
            <button onClick={async () => {
              try { await assignToTeamTicket(ticketId); toast.success('Ticket assigned to team'); router.refresh(); } catch(e: any) { toast.error(e.message); }
            }} className="flex items-center gap-1.5 rounded-lg bg-brand text-white px-3 py-1.5 text-sm font-bold hover:bg-brand-hover">
              Assign to Team
            </button>
            <button 
              onClick={() => setIsTransferOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-line-subtle bg-surface px-3 py-1.5 text-sm font-semibold hover:bg-surface-canvas"
            >
              <Send className="size-4" /> Transfer
            </button>
          </>
        )}

        {/* Manager Actions (Assigned/In-progress, in their department — not NEW) */}
        {isManager && isTargetDepartment && ticket.status !== 'CLOSED' && ticket.status !== 'PENDING_APPROVAL' && ticket.status !== 'NEW' && ticket.status !== 'REJECTED' && (
          <>
            <button 
              onClick={() => setIsAssignOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-line-subtle bg-surface px-3 py-1.5 text-sm font-semibold hover:bg-surface-canvas"
            >
              <UserPlus className="size-4" /> Assign
            </button>
            <button 
              onClick={() => setIsTransferOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-line-subtle bg-surface px-3 py-1.5 text-sm font-semibold hover:bg-surface-canvas"
            >
              <Send className="size-4" /> Transfer
            </button>
          </>
        )}

        {/* Officer Actions: Accept / Wait */}
        {((isAssignedOfficer && ticket.status === 'ASSIGNED') || (isTargetDepartment && !ticket.assignedEmployeeId && (ticket.status === 'ASSIGNED' || ticket.status === 'NEW' || ticket.status === 'TRANSFERRED'))) && (
          <button onClick={async () => {
            try { await acceptTicket(ticketId); toast.success('Ticket accepted'); router.refresh(); } catch(e: any) { toast.error(e.message); }
          }} className="flex items-center gap-1.5 rounded-lg bg-blue-500 text-white px-3 py-1.5 text-sm font-bold hover:bg-blue-600">
            Accept
          </button>
        )}

        {/* Wait and Resolve actions can be done by ANYONE in the target department */}
        {isTargetDepartment && ticket.status === 'IN_PROGRESS' && (
          <>
            <button onClick={() => setIsWaitOpen(true)} className="flex items-center gap-1.5 rounded-lg bg-amber-500 text-white px-3 py-1.5 text-sm font-bold hover:bg-amber-600">
              Wait
            </button>
            <button onClick={() => setIsResolveOpen(true)} className="flex items-center gap-1.5 rounded-lg border border-brand text-brand px-3 py-1.5 text-sm font-bold hover:bg-brand/10">
              Mark Resolved
            </button>
          </>
        )}

        {isTargetDepartment && (ticket.status === 'WAITING' || (ticket.status === 'REJECTED' && ticket.assignedEmployeeId)) && (
          <button onClick={async () => {
             // Resume to In Progress
             try { await acceptTicket(ticketId); toast.success('Ticket resumed'); } catch(e: any) { toast.error(e.message); }
          }} className="flex items-center gap-1.5 rounded-lg bg-blue-500 text-white px-3 py-1.5 text-sm font-bold hover:bg-blue-600">
            Resume Work
          </button>
        )}

        {/* Requester Actions on Rejected (Pre-Assignment) */}
        {ticket.requestedById === principal?.userId && ticket.status === 'REJECTED' && !ticket.assignedEmployeeId && (
          <button onClick={() => setIsResubmitOpen(true)} className="flex items-center gap-1.5 rounded-lg bg-brand text-white px-3 py-1.5 text-sm font-bold hover:bg-brand-hover">
            <Send className="size-4" /> Resubmit Ticket
          </button>
        )}

        {/* Manager Actions on Resolved/InProgress tickets: only target dept manager, requesting manager, or admin */}
        {((isManager && (isTargetDepartment || isRequester)) || isAdmin) && (ticket.status === 'IN_PROGRESS' || ticket.status === 'RESOLVED') && (
          <>
            <button onClick={() => setIsRejectOpen(true)} className="flex items-center gap-1.5 rounded-lg bg-red-500 text-white px-3 py-1.5 text-sm font-bold hover:bg-red-600">
              Reject
            </button>
            <button onClick={() => setIsApproveOpen(true)} className="flex items-center gap-1.5 rounded-lg bg-emerald-500 text-white px-3 py-1.5 text-sm font-bold hover:bg-emerald-600">
              Approve
            </button>
          </>
        )}
      </div>

      {/* Transfer Dialog */}
      {isTransferOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-content-strong">Transfer Ticket</h2>
              <button onClick={() => setIsTransferOpen(false)} className="rounded-md p-1 hover:bg-surface-canvas"><X className="size-5" /></button>
            </div>
            <form onSubmit={handleTransfer} className="flex flex-col gap-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-content-strong">Target Department</label>
                <select 
                  className="w-full rounded-lg border border-line-subtle bg-surface-canvas px-3 py-2 outline-none focus:border-brand"
                  value={targetDepartmentId}
                  onChange={(e) => setTargetDepartmentId(e.target.value)}
                  disabled={loading}
                >
                  <option value="">Select a department...</option>
                  {options?.departments?.map((d: any) => (
                    <option key={d.id} value={d.id}>{d.nameEn}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-content-strong">Reason for Transfer</label>
                <textarea 
                  className="w-full rounded-lg border border-line-subtle bg-surface-canvas px-3 py-2 outline-none focus:border-brand"
                  rows={3}
                  placeholder="Explain why this ticket is being transferred..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="mt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsTransferOpen(false)} className="rounded-lg px-4 py-2 text-sm font-semibold hover:bg-surface-canvas" disabled={loading}>Cancel</button>
                <button type="submit" className="rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white hover:bg-brand-hover disabled:opacity-50" disabled={loading}>
                  {loading ? 'Transferring...' : 'Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Dialog */}
      {isAssignOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-content-strong">Assign Ticket</h2>
              <button onClick={() => setIsAssignOpen(false)} className="rounded-md p-1 hover:bg-surface-canvas"><X className="size-5" /></button>
            </div>
            <form onSubmit={handleAssign} className="flex flex-col gap-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-content-strong">Employee</label>
                <select 
                  className="w-full rounded-lg border border-line-subtle bg-surface-canvas px-3 py-2 outline-none focus:border-brand"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  disabled={loading}
                  required
                >
                  <option value="">Select an employee...</option>
                  {options?.employees?.filter((e: any) => e.departmentId === ticket.targetDepartmentId).map((e: any) => (
                    <option key={e.id} value={e.id}>
                      {e.nameEn} ({e.email}) - {e.activeTicketsCount ?? 0} active task{e.activeTicketsCount === 1 ? '' : 's'}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsAssignOpen(false)} className="rounded-lg px-4 py-2 text-sm font-semibold hover:bg-surface-canvas" disabled={loading}>Cancel</button>
                <button type="submit" className="rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white hover:bg-brand-hover disabled:opacity-50" disabled={loading}>
                  {loading ? 'Assigning...' : 'Assign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Wait Dialog */}
      {isWaitOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-content-strong">Put Ticket on Wait</h2>
              <button onClick={() => setIsWaitOpen(false)} className="rounded-md p-1 hover:bg-surface-canvas"><X className="size-5" /></button>
            </div>
            <form onSubmit={handleWait} className="flex flex-col gap-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-content-strong">Reason for Waiting</label>
                <select 
                  className="w-full rounded-lg border border-line-subtle bg-surface-canvas px-3 py-2 outline-none focus:border-brand"
                  value={waitingReasonId}
                  onChange={(e) => setWaitingReasonId(e.target.value)}
                  disabled={loading}
                  required
                >
                  <option value="">Select a reason...</option>
                  {departmentWaitingReasons.map((r: any) => (
                    <option key={r.id} value={r.id}>{isAr && r.reasonAr ? r.reasonAr : r.reasonEn}</option>
                  ))}
                  {departmentWaitingReasons.length === 0 && (
                    <option value="" disabled>{isAr ? 'لا توجد أسباب انتظار محددة لهذا القسم' : 'No waiting reasons configured for this department'}</option>
                  )}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-content-strong">Additional Details (Optional)</label>
                <textarea 
                  className="w-full rounded-lg border border-line-subtle bg-surface-canvas px-3 py-2 outline-none focus:border-brand"
                  rows={3}
                  placeholder="Explain why this ticket is blocked..."
                  value={customWaitingReason}
                  onChange={(e) => setCustomWaitingReason(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="mt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsWaitOpen(false)} className="rounded-lg px-4 py-2 text-sm font-semibold hover:bg-surface-canvas" disabled={loading}>Cancel</button>
                <button type="submit" className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-white hover:bg-amber-600 disabled:opacity-50" disabled={loading}>
                  {loading ? 'Submitting...' : 'Wait'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolve Dialog */}
      {isResolveOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-content-strong">Resolve Ticket</h2>
              <button onClick={() => setIsResolveOpen(false)} className="rounded-md p-1 hover:bg-surface-canvas"><X className="size-5" /></button>
            </div>
            <form onSubmit={handleResolve} className="flex flex-col gap-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-content-strong">Resolution Subject</label>
                <select 
                  className="w-full rounded-lg border border-line-subtle bg-surface-canvas px-3 py-2 outline-none focus:border-brand"
                  value={resolutionReasonId}
                  onChange={(e) => setResolutionReasonId(e.target.value)}
                  disabled={loading}
                  required
                >
                  <option value="">Select how you resolved this...</option>
                  {departmentResolutionReasons.map((r: any) => (
                    <option key={r.id} value={r.id}>{isAr && r.reasonAr ? r.reasonAr : r.reasonEn}</option>
                  ))}
                  {departmentResolutionReasons.length === 0 && (
                    <option value="" disabled>{isAr ? 'لا توجد موضوعات حل محددة لهذا القسم' : 'No resolution subjects configured for this department'}</option>
                  )}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-content-strong">Description of what you did</label>
                <textarea 
                  className="w-full rounded-lg border border-line-subtle bg-surface-canvas px-3 py-2 outline-none focus:border-brand"
                  rows={4}
                  placeholder="Please describe exactly what actions you took to resolve this ticket..."
                  value={resolutionDetails}
                  onChange={(e) => setResolutionDetails(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
              <div className="mt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsResolveOpen(false)} className="rounded-lg px-4 py-2 text-sm font-semibold hover:bg-surface-canvas" disabled={loading}>Cancel</button>
                <button type="submit" className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-600 disabled:opacity-50" disabled={loading}>
                  {loading ? 'Submitting...' : 'Resolve Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Dialog */}
      {isRejectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-content-strong">Reject Ticket</h2>
              <button onClick={() => setIsRejectOpen(false)} className="rounded-md p-1 hover:bg-surface-canvas"><X className="size-5" /></button>
            </div>
            <form onSubmit={handleReject} className="flex flex-col gap-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-content-strong">Reason for Rejecting</label>
                <select 
                  className="w-full rounded-lg border border-line-subtle bg-surface-canvas px-3 py-2 outline-none focus:border-brand"
                  value={rejectReasonId}
                  onChange={(e) => setRejectReasonId(e.target.value)}
                  disabled={loading}
                  required
                >
                  <option value="">Select a reason...</option>
                  {departmentRejectReasons.map((r: any) => (
                    <option key={r.id} value={r.id}>{isAr && r.reasonAr ? r.reasonAr : r.reasonEn}</option>
                  ))}
                  {departmentRejectReasons.length === 0 && (
                    <option value="" disabled>{isAr ? 'لا توجد أسباب رفض محددة لهذا القسم' : 'No reject reasons configured for this department'}</option>
                  )}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-content-strong">Additional Details (Optional)</label>
                <textarea 
                  className="w-full rounded-lg border border-line-subtle bg-surface-canvas px-3 py-2 outline-none focus:border-brand"
                  rows={3}
                  placeholder="Explain why this ticket is rejected or needs rework..."
                  value={rejectDetails}
                  onChange={(e) => setRejectDetails(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="mt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsRejectOpen(false)} className="rounded-lg px-4 py-2 text-sm font-semibold hover:bg-surface-canvas" disabled={loading}>Cancel</button>
                <button type="submit" className="rounded-lg bg-red-500 px-4 py-2 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-50" disabled={loading}>
                  {loading ? 'Submitting...' : 'Reject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Approve Dialog */}
      {isApproveOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-content-strong">Approve & Rate Ticket</h2>
              <button onClick={() => setIsApproveOpen(false)} className="rounded-md p-1 hover:bg-surface-canvas"><X className="size-5" /></button>
            </div>
            <form onSubmit={handleApprove} className="flex flex-col gap-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-content-strong">Rating (Out of 5)</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`text-2xl transition-colors ${rating >= star ? 'text-amber-500' : 'text-line-subtle hover:text-amber-300'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-content-strong">Feedback Message (Optional)</label>
                <textarea 
                  className="w-full rounded-lg border border-line-subtle bg-surface-canvas px-3 py-2 outline-none focus:border-brand"
                  rows={3}
                  placeholder="Any feedback for the officer?"
                  value={approveFeedback}
                  onChange={(e) => setApproveFeedback(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="mt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsApproveOpen(false)} className="rounded-lg px-4 py-2 text-sm font-semibold hover:bg-surface-canvas" disabled={loading}>Cancel</button>
                <button type="submit" className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-600 disabled:opacity-50" disabled={loading}>
                  {loading ? 'Submitting...' : 'Approve Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resubmit Dialog */}
      {isResubmitOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-content-strong">Resubmit Ticket</h2>
              <button onClick={() => setIsResubmitOpen(false)} className="rounded-md p-1 hover:bg-surface-canvas"><X className="size-5" /></button>
            </div>
            <form onSubmit={handleResubmit} className="flex flex-col gap-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-content-strong">Description / Fix Details</label>
                <textarea 
                  className="w-full rounded-lg border border-line-subtle bg-surface-canvas px-3 py-2 outline-none focus:border-brand"
                  rows={4}
                  placeholder="Explain what you fixed or changed..."
                  value={resubmitReason}
                  onChange={(e) => setResubmitReason(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="mt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setIsResubmitOpen(false)} className="rounded-lg px-4 py-2 text-sm font-semibold text-content-strong hover:bg-surface-canvas" disabled={loading}>
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50">
                  {loading ? 'Resubmitting...' : 'Resubmit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

type PortalAuditContext = { correlationId?: string | null; ipAddress?: string | null; userAgent?: string | null };
type PortalVerification = { id: string; complaintId: string; customerId: string };

export function portalAudit(action: string, verification: PortalVerification, input: PortalAuditContext, metadata: Record<string, unknown>) {
  return {
    eventType: 'SECURITY' as const,
    action,
    actorId: null,
    branchId: null,
    targetType: 'portal_verification',
    targetId: verification.id,
    correlationId: input.correlationId ?? null,
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
    metadata: { complaintId: verification.complaintId, customerId: verification.customerId, ...metadata },
  };
}

export function portalUnknownAudit(verificationId: string, input: PortalAuditContext, reason: string) {
  return {
    eventType: 'SECURITY' as const,
    action: 'portal_otp_failed',
    actorId: null,
    branchId: null,
    targetType: 'portal_verification',
    targetId: verificationId,
    correlationId: input.correlationId ?? null,
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
    metadata: { reason },
  };
}

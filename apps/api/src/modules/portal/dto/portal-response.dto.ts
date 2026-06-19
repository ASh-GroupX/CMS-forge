import type { ComplaintCreationResult } from '../../complaints/complaints.service.js';
import type { PortalSessionResult, PortalTrackingResult } from '../portal.service.js';

export type PortalComplaintResponseDto = {
  complaint: ComplaintCreationResult;
};

export type PortalOtpRequestResponseDto = {
  ok: true;
};

export type PortalSessionResponseDto = {
  session: PortalSessionResult;
};

export type PortalTrackingResponseDto = {
  complaint: PortalTrackingResult;
};

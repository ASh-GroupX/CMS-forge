import type { ComplaintCreationResult } from '../../complaints/complaints.service.js';
import type { PortalFollowUpResult, PortalOtpRequestResult, PortalSessionResult, PortalTrackingResult } from '../portal.service.js';

export type PortalComplaintResponseDto = {
  complaint: ComplaintCreationResult;
};

export type PortalOtpRequestResponseDto = PortalOtpRequestResult;

export type PortalSessionResponseDto = {
  session: PortalSessionResult;
};

export type PortalTrackingResponseDto = {
  complaint: PortalTrackingResult;
};

export type PortalFollowUpResponseDto = PortalFollowUpResult;

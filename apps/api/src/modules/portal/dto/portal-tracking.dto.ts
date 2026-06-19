import { HttpStatus } from '@nestjs/common';
import { AppException } from '../../../core/http-kernel.js';
import type { RequestPortalOtpInput, VerifyPortalOtpInput } from '../portal.service.js';

export type PortalTrackingOtpRequestDto = {
  referenceNumber: string;
  customerPhone: string;
};

export type PortalTrackingOtpVerifyDto = {
  verificationId: string;
  otp: string;
};

export type PortalFollowUpDto = {
  body: string;
};

export function parsePortalTrackingOtpBody(body: unknown): PortalTrackingOtpRequestDto {
  const input = objectBody(body);
  return {
    referenceNumber: requiredText(input.referenceNumber, 'referenceNumber'),
    customerPhone: requiredText(input.customerPhone, 'customerPhone'),
  };
}

export function parsePortalTrackingOtpVerifyBody(body: unknown): PortalTrackingOtpVerifyDto {
  const input = objectBody(body);
  return {
    verificationId: requiredText(input.verificationId, 'verificationId'),
    otp: requiredText(input.otp, 'otp'),
  };
}

export function parsePortalFollowUpBody(body: unknown): PortalFollowUpDto {
  return { body: requiredText(objectBody(body).body, 'body') };
}

export function toPortalOtpInput(
  body: PortalTrackingOtpRequestDto,
  context: Pick<RequestPortalOtpInput, 'correlationId' | 'ipAddress' | 'userAgent'>,
): RequestPortalOtpInput {
  return { ...body, ...context };
}

export function toPortalOtpVerifyInput(
  body: PortalTrackingOtpVerifyDto,
  context: Pick<VerifyPortalOtpInput, 'correlationId' | 'ipAddress' | 'userAgent'>,
): VerifyPortalOtpInput {
  return { ...body, ...context };
}

function objectBody(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw invalid('body', 'Request body must be an object.');
  }
  return body as Record<string, unknown>;
}

function requiredText(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw invalid(field, `${field} is required.`);
  }
  return value.trim();
}

function invalid(field: string, message: string): AppException {
  return new AppException('VALIDATION_FAILED', 'Invalid portal tracking request', HttpStatus.BAD_REQUEST, [
    { field, code: 'REQUIRED', message },
  ]);
}

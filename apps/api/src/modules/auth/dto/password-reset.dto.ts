import { HttpStatus } from '@nestjs/common';
import { AppException } from '../../../core/http-kernel.js';
import type { FieldError } from '../../../core/http-kernel.js';

export class PasswordResetRequestDto {
  constructor(readonly identifier: string) {}

  static from(body: unknown): PasswordResetRequestDto {
    const input = objectBody(body, 'Invalid password reset request');
    const fieldErrors: FieldError[] = [];
    if (typeof input.identifier !== 'string') {
      fieldErrors.push({ field: 'identifier', code: 'INVALID_TYPE', message: 'Identifier must be a string.' });
    } else if (!input.identifier.trim()) {
      fieldErrors.push({ field: 'identifier', code: 'REQUIRED', message: 'Identifier is required.' });
    }
    if (fieldErrors.length) throw invalidPasswordReset(fieldErrors);
    return new PasswordResetRequestDto((input.identifier as string).trim());
  }
}

export class PasswordResetConsumeDto {
  constructor(readonly token: string, readonly newPassword: string) {}

  static from(body: unknown): PasswordResetConsumeDto {
    const input = objectBody(body, 'Invalid password reset request');
    const fieldErrors: FieldError[] = [];
    if (typeof input.token !== 'string') {
      fieldErrors.push({ field: 'token', code: 'INVALID_TYPE', message: 'Token must be a string.' });
    } else if (!input.token.trim()) {
      fieldErrors.push({ field: 'token', code: 'REQUIRED', message: 'Token is required.' });
    }
    if (typeof input.newPassword !== 'string') {
      fieldErrors.push({ field: 'newPassword', code: 'INVALID_TYPE', message: 'Password must be a string.' });
    } else if (input.newPassword.length < 12) {
      fieldErrors.push({ field: 'newPassword', code: 'MIN_LENGTH', message: 'Password must be at least 12 characters.' });
    }
    if (fieldErrors.length) throw invalidPasswordReset(fieldErrors);
    return new PasswordResetConsumeDto((input.token as string).trim(), input.newPassword as string);
  }
}

function objectBody(body: unknown, message: string): Record<string, unknown> {
  if (!body || typeof body !== 'object') {
    throw new AppException('VALIDATION_FAILED', message, HttpStatus.BAD_REQUEST, [
      { field: 'body', code: 'INVALID_TYPE', message: 'Request body must be an object.' },
    ]);
  }
  return body as Record<string, unknown>;
}

function invalidPasswordReset(fieldErrors: FieldError[]): AppException {
  return new AppException('VALIDATION_FAILED', 'Invalid password reset request', HttpStatus.BAD_REQUEST, fieldErrors);
}

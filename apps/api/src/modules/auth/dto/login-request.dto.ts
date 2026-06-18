import { HttpStatus } from '@nestjs/common';
import { AppException } from '../../../core/http-kernel.js';
import type { FieldError } from '../../../core/http-kernel.js';

export class LoginRequestDto {
  constructor(
    readonly identifier: string,
    readonly password: string,
  ) {}

  static from(body: unknown): LoginRequestDto {
    if (!body || typeof body !== 'object') {
      throw invalidLoginRequest([
        { field: 'body', code: 'INVALID_TYPE', message: 'Request body must be an object.' },
      ]);
    }

    const input = body as Record<string, unknown>;
    const fieldErrors: FieldError[] = [];

    if (typeof input.identifier !== 'string') {
      fieldErrors.push({ field: 'identifier', code: 'INVALID_TYPE', message: 'Identifier must be a string.' });
    } else if (!input.identifier.trim()) {
      fieldErrors.push({ field: 'identifier', code: 'REQUIRED', message: 'Identifier is required.' });
    }

    if (typeof input.password !== 'string') {
      fieldErrors.push({ field: 'password', code: 'INVALID_TYPE', message: 'Password must be a string.' });
    } else if (!input.password) {
      fieldErrors.push({ field: 'password', code: 'REQUIRED', message: 'Password is required.' });
    }

    if (fieldErrors.length > 0) {
      throw invalidLoginRequest(fieldErrors);
    }

    const identifier = input.identifier as string;
    const password = input.password as string;
    return new LoginRequestDto(identifier.trim(), password);
  }
}

function invalidLoginRequest(fieldErrors: FieldError[]): AppException {
  return new AppException('VALIDATION_FAILED', 'Invalid login request', HttpStatus.BAD_REQUEST, fieldErrors);
}

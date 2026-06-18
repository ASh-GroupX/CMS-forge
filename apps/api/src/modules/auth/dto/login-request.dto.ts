import { HttpStatus } from '@nestjs/common';
import { AppException } from '../../../core/http-kernel.js';

export class LoginRequestDto {
  constructor(
    readonly identifier: string,
    readonly password: string,
  ) {}

  static from(body: unknown): LoginRequestDto {
    if (!body || typeof body !== 'object') {
      throw invalidLoginRequest();
    }

    const input = body as Record<string, unknown>;
    if (typeof input.identifier !== 'string' || typeof input.password !== 'string') {
      throw invalidLoginRequest();
    }

    const identifier = input.identifier.trim();
    if (!identifier || !input.password) {
      throw invalidLoginRequest();
    }

    return new LoginRequestDto(identifier, input.password);
  }
}

function invalidLoginRequest(): AppException {
  return new AppException('VALIDATION_FAILED', 'Invalid login request', HttpStatus.BAD_REQUEST);
}

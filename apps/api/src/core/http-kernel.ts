import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { IncomingMessage, ServerResponse } from 'node:http';

type ErrorBody = {
  error: {
    code: string;
    message: string;
    correlationId: string;
    fieldErrors?: FieldError[];
  };
};

export type FieldError = {
  field: string;
  code: string;
  message: string;
};

type JsonResponse = {
  status(code: number): { json(body: ErrorBody): void };
};

type RequestWithCorrelation = IncomingMessage & {
  correlationId?: string;
};

export class AppException extends HttpException {
  constructor(
    readonly code: string,
    readonly safeMessage: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
    readonly fieldErrors: FieldError[] = [],
  ) {
    super({ code, message: safeMessage }, status);
  }
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}

export function correlationMiddleware(
  req: RequestWithCorrelation,
  res: ServerResponse,
  next: () => void,
): void {
  const header = req.headers['x-correlation-id'];
  const correlationId = Array.isArray(header) ? header[0] : header;
  req.correlationId = correlationId ?? `req_${randomUUID()}`;
  res.setHeader('x-correlation-id', req.correlationId);
  next();
}

@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<JsonResponse>();
    const request = context.getRequest<RequestWithCorrelation>();
    const isHttp = exception instanceof HttpException;
    const status = isHttp ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const appError = exception instanceof AppException ? exception : undefined;
    const body: ErrorBody = {
      error: {
        code: appError?.code ?? 'INTERNAL_ERROR',
        message: appError?.safeMessage ?? 'Request failed',
        correlationId: request.correlationId ?? `req_${randomUUID()}`,
      },
    };

    if (appError?.fieldErrors.length) {
      body.error.fieldErrors = appError.fieldErrors;
    }

    response.status(status).json(body);
  }
}

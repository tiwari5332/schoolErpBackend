import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { DomainError } from './domain.error';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    const requestId =
      (request.headers['x-request-id'] as string) ||
      (request as any).id ||
      `req_${Date.now().toString(36)}`;

    response.header('x-request-id', requestId);

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'An unexpected internal server error occurred';
    let details: Array<{ field?: string; message: string }> | undefined;

    if (exception instanceof DomainError) {
      status = exception.statusCode;
      code = exception.code;
      message = exception.message;
      details = exception.details;
    } else if (exception instanceof ZodError) {
      status = HttpStatus.UNPROCESSABLE_ENTITY; // 422 per contract convention
      code = 'VALIDATION_ERROR';
      message = 'Request validation failed';
      details = exception.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const body = res as Record<string, any>;
        message = body['message'] || exception.message;
        if (body['code']) code = body['code'];
      }

      // Map standard HTTP status codes to contract error codes
      if (status === HttpStatus.UNAUTHORIZED) code = 'UNAUTHENTICATED';
      else if (status === HttpStatus.FORBIDDEN) code = 'FORBIDDEN';
      else if (status === HttpStatus.NOT_FOUND) code = 'NOT_FOUND';
      else if (status === HttpStatus.CONFLICT) code = 'CONFLICT';
      else if (status === HttpStatus.TOO_MANY_REQUESTS) code = 'RATE_LIMITED';
      else if (status === HttpStatus.PAYMENT_REQUIRED) code = 'SUBSCRIPTION_EXPIRED';
      else if (status === HttpStatus.UNPROCESSABLE_ENTITY) code = 'VALIDATION_ERROR';
    } else if (exception instanceof Error) {
      this.logger.error(`Unhandled Exception: ${exception.message}`, exception.stack);
      message = 'An unexpected internal server error occurred';
    }

    response.status(status).send({
      success: false,
      error: {
        code,
        message,
        ...(details && details.length > 0 ? { details } : {}),
      },
      requestId,
    });
  }
}


import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { FastifyRequest, FastifyReply } from 'fastify';

export interface SuccessEnvelope<T> {
  success: true;
  data: T;
  meta?: any;
  requestId: string;
}

@Injectable()
export class EnvelopeInterceptor<T> implements NestInterceptor<T, SuccessEnvelope<T> | T> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<SuccessEnvelope<T> | T> {
    const http = context.switchToHttp();
    const req = http.getRequest<FastifyRequest>();
    const reply = http.getResponse<FastifyReply>();

    const requestId =
      (req.headers['x-request-id'] as string) ||
      (req as any).id ||
      `req_${Date.now().toString(36)}`;

    // Set X-Request-Id header in response
    reply.header('x-request-id', requestId);

    return next.handle().pipe(
      map((res) => {
        // If 204 No Content or binary response, return as is
        if (reply.statusCode === 204 || res === undefined || res === null) {
          return res;
        }

        // If response is already an envelope, avoid double wrapping
        if (res && typeof res === 'object' && res.success === true && 'data' in res) {
          return {
            ...res,
            requestId: res.requestId || requestId,
          };
        }

        // Handle case where service returns { data, meta }
        if (res && typeof res === 'object' && 'data' in res && 'meta' in res) {
          return {
            success: true,
            data: res.data,
            meta: res.meta,
            requestId,
          };
        }

        return {
          success: true,
          data: res,
          requestId,
        };
      }),
    );
  }
}


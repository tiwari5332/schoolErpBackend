import { HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../contract/generated/enums';

export interface ErrorDetail {
  field?: string;
  message: string;
}

export class DomainError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: ErrorDetail[];

  constructor(
    code: ErrorCode,
    message: string,
    details?: ErrorDetail[],
    statusCode?: number,
  ) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
    this.details = details;

    if (statusCode) {
      this.statusCode = statusCode;
    } else {
      this.statusCode = DomainError.getDefaultStatusCode(code);
    }
  }

  private static getDefaultStatusCode(code: ErrorCode): number {
    switch (code) {
      case 'VALIDATION_ERROR':
      case 'IMPORT_VALIDATION_FAILED':
        return HttpStatus.UNPROCESSABLE_ENTITY; // 422
      case 'UNAUTHENTICATED':
      case 'TOKEN_EXPIRED':
        return HttpStatus.UNAUTHORIZED; // 401
      case 'SUBSCRIPTION_EXPIRED':
      case 'PLAN_LIMIT_REACHED':
        return HttpStatus.PAYMENT_REQUIRED; // 402
      case 'FORBIDDEN':
        return HttpStatus.FORBIDDEN; // 403
      case 'NOT_FOUND':
        return HttpStatus.NOT_FOUND; // 404
      case 'CONFLICT':
      case 'DUPLICATE_ENTRY':
      case 'SESSION_LOCKED':
      case 'EXAM_PUBLISHED_LOCKED':
      case 'MARKS_LOCKED':
      case 'TIMETABLE_CONFLICT':
      case 'PAYMENT_FAILED':
        return HttpStatus.CONFLICT; // 409
      case 'RATE_LIMITED':
        return HttpStatus.TOO_MANY_REQUESTS; // 429
      default:
        return HttpStatus.INTERNAL_SERVER_ERROR; // 500
    }
  }
}


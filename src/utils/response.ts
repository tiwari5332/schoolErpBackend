import { Response } from 'express';

export class AppError extends Error {
  public statusCode: number;
  public code?: string;
  public isOperational: boolean;
  public details?: any;

  constructor(message: string, statusCode: number = 500, details?: any, isOperational: boolean = true, code?: string) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BusinessRuleException extends AppError {
  constructor(message: string, statusCode: number = 409, details?: any, code: string = 'CONFLICT') {
    super(message, statusCode, details, true, code);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', details?: any) {
    super(message, 401, details, true, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access Denied', details?: any) {
    super(message, 403, details, true, 'FORBIDDEN');
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource Not Found', details?: any) {
    super(message, 404, details, true, 'NOT_FOUND');
  }
}

export class ApiResponse {
  static success<T>(res: Response, data: T, statusCode: number = 200) {
    console.log(statusCode, data)
    return res.status(statusCode).json({
      status: "success",
      result: data
    });
  }

  static error(res: Response, message: string, statusCode: number = 500, details: any = null, code?: string) {
    const defaultCode =
      statusCode === 400
        ? 'VALIDATION_ERROR'
        : statusCode === 401
        ? 'UNAUTHORIZED'
        : statusCode === 403
        ? 'FORBIDDEN'
        : statusCode === 404
        ? 'NOT_FOUND'
        : statusCode === 409
        ? 'CONFLICT'
        : 'INTERNAL_SERVER_ERROR';

    return res.status(statusCode).json({
      code: code || defaultCode,
      message,
      error: message,
      status: statusCode,
      timestamp: new Date().toISOString(),
      ...(details !== undefined && details !== null ? { details } : {}),
    });
  }
}

import { Response } from 'express';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public details?: any;

  constructor(message: string, statusCode: number = 500, details?: any, isOperational: boolean = true) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BusinessRuleException extends AppError {
  constructor(message: string, statusCode: number = 409, details?: any) {
    super(message, statusCode, details, true);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', details?: any) {
    super(message, 401, details, true);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access Denied', details?: any) {
    super(message, 403, details, true);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource Not Found', details?: any) {
    super(message, 404, details, true);
  }
}

export class ApiResponse {
  static success<T>(res: Response, data: T, statusCode: number = 200) {
    return res.status(statusCode).json(data);
  }

  static error(res: Response, message: string, statusCode: number = 500, details: any = null) {
    return res.status(statusCode).json({
      error: message,
      status: statusCode,
      timestamp: new Date().toISOString(),
      ...(details ? { details } : {}),
    });
  }
}

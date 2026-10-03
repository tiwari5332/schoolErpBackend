import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ApiResponse, AppError } from '../utils/response';
import { Logger } from '../libs/logger';
import { ExtendedRequest } from './logger.middleware';

export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const extReq = req as ExtendedRequest;
  const context = {
    requestId: extReq.requestId,
    sessionId: extReq.sessionId,
    actorId: extReq.user?.actorId,
    schoolId: extReq.user?.schoolId,
    path: req.originalUrl,
    method: req.method,
  };

  Logger.error(`Error processing ${req.method} ${req.originalUrl}: ${err.message}`, err, context);

  if (err instanceof AppError) {
    return ApiResponse.error(res, err.message, err.statusCode, err.details);
  }

  if (err instanceof ZodError) {
    return ApiResponse.error(res, 'Validation Error', 400, err.errors);
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = process.env.NODE_ENV === 'production' && statusCode === 500
    ? 'Internal Server Error'
    : err.message || 'Internal Server Error';

  return ApiResponse.error(res, message, statusCode);
};

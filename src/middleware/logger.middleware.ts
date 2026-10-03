import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { HashUtils } from '../utils/hash';
import { env } from '../config/env';
import { Logger } from '../libs/logger';
import { SecurityPrincipal } from '../utils/jwt';

export interface ExtendedRequest extends Request {
  requestId?: string;
  sessionId?: string;
  user?: SecurityPrincipal;
  file?: any;
}

export const requestResponseLogger = (req: ExtendedRequest, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const requestId = (req.headers['x-request-id'] as string) || `req-${uuidv4()}`;
  req.requestId = requestId;

  let sessionId = req.headers['x-session-id'] as string;
  if (!sessionId) {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      sessionId = `sess-${HashUtils.computeTokenHash(token)}`;
    } else {
      sessionId = `anon-${uuidv4()}`;
    }
  }
  req.sessionId = sessionId;

  res.setHeader('X-Request-Id', requestId);
  res.setHeader('X-Session-Id', sessionId);

  const isDetailedLog = env.DETAILED_LOGGING_URIS_LIST.some((uri) => req.originalUrl.includes(uri));

  if (isDetailedLog) {
    Logger.info(`Incoming Request: ${req.method} ${req.originalUrl}`, {
      requestId,
      sessionId,
      headers: req.headers,
      body: req.body,
    });
  }

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    Logger.info(`Completed Request: ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`, {
      requestId,
      sessionId,
      statusCode: res.statusCode,
      durationMs: duration,
    });
  });

  next();
};

import { Response, NextFunction } from 'express';
import { ExtendedRequest } from './logger.middleware';
import { JwtUtils, SecurityPrincipal } from '../utils/jwt';
import { UnauthorizedError } from '../utils/response';

const PUBLIC_PATHS = [
  '/',
  '/health',
  '/api/public/ping',
  '/api/auth/register',
  '/api/auth/admin/login',
  '/api/auth/teacher/login',
  '/api/auth/parent/login',
  '/api/auth/parent/schools',
  '/api/auth/signup',
  '/api/auth/create-password',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/otp/send',
  '/api/auth/otp/resend',
  '/api/auth/otp/verify',
];

export const jwtAuthFilter = (req: ExtendedRequest, res: Response, next: NextFunction) => {
  const path = req.path;

  // Check if public path or starts with public prefix
  if (
    PUBLIC_PATHS.includes(path) ||
    path.startsWith('/api/public/')
  ) {
    return next();
  }

  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Missing or invalid Authorization header'));
  }

  const token = authHeader.substring(7);
  try {
    const payload = JwtUtils.verifyToken<any>(token);
    req.user = {
      actorId: payload.sub,
      actorType: payload.actorType,
      schoolId: payload.schoolId || null,
      planCode: payload.planCode,
      features: payload.features || [],
    } as SecurityPrincipal;

    return next();
  } catch (err) {
    return next(new UnauthorizedError('Invalid or expired JWT token'));
  }
};

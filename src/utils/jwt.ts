import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface SecurityPrincipal {
  actorId: string;
  actorType: string;
  schoolId: string | null;
  planCode?: string;
  features?: string[];
}

export interface SignupTokenPayload {
  sub: string;
  purpose: string;
  actorType: string;
  schoolId: string;
  msisdn: string;
}

export class JwtUtils {
  static generateLoginToken(principal: SecurityPrincipal): string {
    return jwt.sign(
      {
        sub: principal.actorId,
        actorType: principal.actorType,
        schoolId: principal.schoolId,
        planCode: principal.planCode,
        features: principal.features || [],
      },
      env.JWT_SECRET,
      { expiresIn: Math.floor(env.JWT_EXPIRATION_MS / 1000) }
    );
  }

  static generateSignupToken(actorId: string, actorType: string, schoolId: string, msisdn: string): string {
    return jwt.sign(
      {
        sub: actorId,
        purpose: 'SIGNUP',
        actorType,
        schoolId,
        msisdn,
      },
      env.JWT_SECRET,
      { expiresIn: Math.floor(env.SIGNUP_TOKEN_EXPIRATION_MS / 1000) }
    );
  }

  static verifyToken<T = any>(token: string): T {
    return jwt.verify(token, env.JWT_SECRET) as T;
  }
}

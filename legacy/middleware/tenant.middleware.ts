import { Response, NextFunction } from 'express';
import { ExtendedRequest } from './logger.middleware';

export const tenantInterceptor = (req: ExtendedRequest, res: Response, next: NextFunction) => {
  // Tenant context is extracted from req.user set by jwtAuthFilter
  next();
};

export const getTenantSchoolId = (req: ExtendedRequest): string | null => {
  return req.user?.schoolId || null;
};


export const createSchoolId = (schoolName: string): string => {
  // Create a unique school ID based on the school name and current timestamp
  const timestamp = new Date().getFullYear().toString().slice(-2);;
  const sanitizedSchoolName = schoolName.split(' ').map(word => word.charAt(0).toUpperCase()).join('');
  return `${sanitizedSchoolName}-${timestamp}`;
}
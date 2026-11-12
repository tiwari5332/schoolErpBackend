import { Response, NextFunction } from 'express';
import { ExtendedRequest } from './logger.middleware';
import { ForbiddenError, UnauthorizedError } from '../utils/response';
import { ActorType } from '../config/constants';

/**
 * Feature Gating Middleware (HLD Section 4.2)
 * Verifies that the tenant's active subscription plan includes the required capability.
 */
export const hasFeature = (featureCode: string) => {
  return (req: ExtendedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('User unauthenticated'));
    }

    // Super Admin bypasses all plan feature restrictions
    if (req.user.actorType === ActorType.SUPER_ADMIN) {
      return next();
    }

    const schoolFeatures = req.user.features || [];
    if (schoolFeatures.includes(featureCode)) {
      return next();
    }

    return next(
      new ForbiddenError(
        `Feature '${featureCode}' is not enabled in your school subscription plan. Please upgrade your plan.`
      )
    );
  };
};

export default hasFeature;


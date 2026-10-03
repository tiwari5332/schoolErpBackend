import { SecurityPrincipal } from '../utils/jwt';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      sessionId?: string;
      user?: SecurityPrincipal;
    }
  }
}

/**
 * Authentication middleware for JWT token verification
 */
import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@/types/auth';
/**
 * Middleware to verify JWT token and attach user to request
 */
export declare const authenticateToken: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware to require specific user roles
 */
export declare const requireRole: (allowedRoles: UserRole[]) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware to require minimum user role level
 */
export declare const requireMinRole: (minRole: UserRole) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware to check if user owns a resource (for tenant isolation)
 */
export declare const requireOwnership: (resourceIdParam?: string) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Optional authentication - attach user if token is valid, but don't require it
 */
export declare const optionalAuth: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auth.d.ts.map
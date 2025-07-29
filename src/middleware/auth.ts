/**
 * Authentication middleware for JWT token verification
 */
import { Request, Response, NextFunction } from 'express';
import { authService } from '@/services/AuthService';
import { UserRole } from '@/types/auth';

/**
 * Middleware to verify JWT token and attach user to request
 */
export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({ 
        error: 'Access token required',
        code: 'MISSING_TOKEN'
      });
      return;
    }

    // Verify token
    const decoded = authService.verifyAccessToken(token);
    
    // Get fresh user data
    const user = await authService.getUserById(decoded.userId, decoded.tenantId);
    
    if (!user) {
      res.status(401).json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
      return;
    }

    // Attach user to request
    req.user = user;
    
    // Ensure tenant context matches token
    if (req.tenantContext) {
      req.tenantContext.tenantId = decoded.tenantId;
    }

    next();
  } catch (error) {
    res.status(401).json({ 
      error: 'Invalid or expired token',
      code: 'INVALID_TOKEN',
      message: error instanceof Error ? error.message : 'Token verification failed'
    });
  }
};

/**
 * Middleware to require specific user roles
 */
export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ 
        error: 'Authentication required',
        code: 'NOT_AUTHENTICATED'
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ 
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required_roles: allowedRoles,
        user_role: req.user.role
      });
      return;
    }

    next();
  };
};

/**
 * Middleware to require minimum user role level
 */
export const requireMinRole = (minRole: UserRole) => {
  const roleHierarchy: Record<UserRole, number> = {
    [UserRole.CUSTOMER]: 1,
    [UserRole.STAFF]: 2,
    [UserRole.MANAGER]: 3,
    [UserRole.ADMIN]: 4,
    [UserRole.SUPER_ADMIN]: 5
  };

  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ 
        error: 'Authentication required',
        code: 'NOT_AUTHENTICATED'
      });
      return;
    }

    const userRoleLevel = roleHierarchy[req.user.role];
    const minRoleLevel = roleHierarchy[minRole];

    if (userRoleLevel < minRoleLevel) {
      res.status(403).json({ 
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS', 
        required_min_role: minRole,
        user_role: req.user.role
      });
      return;
    }

    next();
  };
};

/**
 * Middleware to check if user owns a resource (for tenant isolation)
 */
export const requireOwnership = (resourceIdParam: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ 
        error: 'Authentication required',
        code: 'NOT_AUTHENTICATED'
      });
      return;
    }

    const resourceId = req.params[resourceIdParam];
    
    // For now, we just check tenant isolation
    // This can be extended for more granular ownership checks
    if (req.user.tenant_id !== req.tenantContext?.tenantId) {
      res.status(403).json({ 
        error: 'Access denied - tenant mismatch',
        code: 'TENANT_MISMATCH'
      });
      return;
    }

    next();
  };
};

/**
 * Optional authentication - attach user if token is valid, but don't require it
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = authService.verifyAccessToken(token);
      const user = await authService.getUserById(decoded.userId, decoded.tenantId);
      
      if (user) {
        req.user = user;
        if (req.tenantContext) {
          req.tenantContext.tenantId = decoded.tenantId;
        }
      }
    }

    next();
  } catch (error) {
    // Don't block the request if optional auth fails
    next();
  }
};
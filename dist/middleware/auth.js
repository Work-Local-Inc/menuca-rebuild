"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.requireOwnership = exports.requireMinRole = exports.requireRole = exports.authenticateToken = void 0;
const AuthService_1 = require("@/services/AuthService");
const auth_1 = require("@/types/auth");
/**
 * Middleware to verify JWT token and attach user to request
 */
const authenticateToken = async (req, res, next) => {
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
        const decoded = AuthService_1.authService.verifyAccessToken(token);
        // Get fresh user data
        const user = await AuthService_1.authService.getUserById(decoded.userId, decoded.tenantId);
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
    }
    catch (error) {
        res.status(401).json({
            error: 'Invalid or expired token',
            code: 'INVALID_TOKEN',
            message: error instanceof Error ? error.message : 'Token verification failed'
        });
    }
};
exports.authenticateToken = authenticateToken;
/**
 * Middleware to require specific user roles
 */
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
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
exports.requireRole = requireRole;
/**
 * Middleware to require minimum user role level
 */
const requireMinRole = (minRole) => {
    const roleHierarchy = {
        [auth_1.UserRole.CUSTOMER]: 1,
        [auth_1.UserRole.STAFF]: 2,
        [auth_1.UserRole.MANAGER]: 3,
        [auth_1.UserRole.ADMIN]: 4,
        [auth_1.UserRole.SUPER_ADMIN]: 5
    };
    return (req, res, next) => {
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
exports.requireMinRole = requireMinRole;
/**
 * Middleware to check if user owns a resource (for tenant isolation)
 */
const requireOwnership = (resourceIdParam = 'id') => {
    return (req, res, next) => {
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
exports.requireOwnership = requireOwnership;
/**
 * Optional authentication - attach user if token is valid, but don't require it
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        if (token) {
            const decoded = AuthService_1.authService.verifyAccessToken(token);
            const user = await AuthService_1.authService.getUserById(decoded.userId, decoded.tenantId);
            if (user) {
                req.user = user;
                if (req.tenantContext) {
                    req.tenantContext.tenantId = decoded.tenantId;
                }
            }
        }
        next();
    }
    catch (error) {
        // Don't block the request if optional auth fails
        next();
    }
};
exports.optionalAuth = optionalAuth;
//# sourceMappingURL=auth.js.map
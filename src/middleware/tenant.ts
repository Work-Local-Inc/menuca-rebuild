import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
      userId?: string;
    }
  }
}

/**
 * Middleware to extract and validate tenant information
 */
export const tenantMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Get tenant ID from header, subdomain, or default
    const tenantHeader = req.headers['x-tenant-id'] as string;
    const subdomain = req.hostname.split('.')[0];
    
    // Priority: header > subdomain > default
    let tenantId = tenantHeader || 
                   (subdomain !== 'localhost' && subdomain !== req.hostname ? subdomain : null) ||
                   process.env.DEFAULT_TENANT_ID || 'default';
    
    // Validate tenant ID format (alphanumeric, hyphens, underscores only)
    if (!/^[a-zA-Z0-9_-]+$/.test(tenantId)) {
      res.status(400).json({ 
        error: 'Invalid tenant ID format',
        code: 'INVALID_TENANT_ID'
      });
      return;
    }
    
    // Attach tenant ID to request
    req.tenantId = tenantId;
    
    next();
  } catch (error) {
    res.status(500).json({ 
      error: 'Tenant middleware error',
      code: 'TENANT_MIDDLEWARE_ERROR'
    });
    return;
  }
};

/**
 * Middleware to validate tenant access
 */
export const validateTenantAccess = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.tenantId) {
    res.status(400).json({ 
      error: 'Tenant ID required',
      code: 'MISSING_TENANT_ID'
    });
    return;
  }
  
  // Add additional tenant validation logic here if needed
  // e.g., check if tenant exists, is active, etc.
  
  next();
};

// Alias for backwards compatibility
export const validateTenant = validateTenantAccess; 
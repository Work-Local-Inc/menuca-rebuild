/**
 * Role-Based Access Control (RBAC) Management API Routes
 * Provides endpoints for advanced permission management
 */
import express, { Request, Response, NextFunction } from 'express';
import { authenticateToken } from '@/middleware/auth';
import { rbacService, Permission, requirePermission } from '@/middleware/rbac';
import { UserRole } from '@/types/auth';
import db from '@/database/connection';
import winston from 'winston';

const router = express.Router();
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

// =========================================
// USER PERMISSIONS MANAGEMENT
// =========================================

// Get user permissions
router.get('/users/:userId/permissions',
  authenticateToken,
  requirePermission(Permission.USER_READ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      
      // Validate user can access this data (own data or admin)
      if (req.user!.id !== userId && req.user!.role !== UserRole.ADMIN && req.user!.role !== UserRole.SUPER_ADMIN) {
        res.status(403).json({
          error: 'Cannot access other users permissions',
          code: 'ACCESS_DENIED'
        });
        return;
      }
      
      const permissions = await rbacService.getUserPermissions(userId, req.user!.tenant_id);
      
      if (!permissions) {
        res.status(404).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
        return;
      }
      
      res.json({
        success: true,
        data: permissions
      });
      
    } catch (error) {
      logger.error('Failed to get user permissions:', error);
      next(error);
    }
  }
);

// Grant permission to user
router.post('/users/:userId/permissions/:permission',
  authenticateToken,
  requirePermission(Permission.USER_UPDATE),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, permission } = req.params;
      const { reason } = req.body;
      
      // Validate permission exists
      if (!Object.values(Permission).includes(permission as Permission)) {
        res.status(400).json({
          error: 'Invalid permission',
          code: 'INVALID_PERMISSION'
        });
        return;
      }
      
      // Only super admins can grant security permissions
      if (permission.includes('security:') || permission.includes('encryption:') || permission.includes('audit:manage')) {
        if (req.user!.role !== UserRole.SUPER_ADMIN) {
          res.status(403).json({
            error: 'Insufficient privileges to grant security permissions',
            code: 'INSUFFICIENT_PRIVILEGES'
          });
          return;
        }
      }
      
      await rbacService.grantPermission(
        userId,
        req.user!.tenant_id,
        permission as Permission,
        req.user!.id
      );
      
      // Log to audit trail
      await logPermissionChange(
        req.user!.tenant_id,
        userId,
        permission,
        'granted',
        req.user!.id,
        reason,
        req.ip,
        req.get('User-Agent')
      );
      
      res.json({
        success: true,
        message: 'Permission granted successfully'
      });
      
    } catch (error) {
      logger.error('Failed to grant permission:', error);
      next(error);
    }
  }
);

// Revoke permission from user
router.delete('/users/:userId/permissions/:permission',
  authenticateToken,
  requirePermission(Permission.USER_UPDATE),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, permission } = req.params;
      const { reason } = req.body;
      
      // Validate permission exists
      if (!Object.values(Permission).includes(permission as Permission)) {
        res.status(400).json({
          error: 'Invalid permission',
          code: 'INVALID_PERMISSION'
        });
        return;
      }
      
      await rbacService.revokePermission(
        userId,
        req.user!.tenant_id,
        permission as Permission,
        req.user!.id
      );
      
      // Log to audit trail
      await logPermissionChange(
        req.user!.tenant_id,
        userId,
        permission,
        'revoked',
        req.user!.id,
        reason,
        req.ip,
        req.get('User-Agent')
      );
      
      res.json({
        success: true,
        message: 'Permission revoked successfully'
      });
      
    } catch (error) {
      logger.error('Failed to revoke permission:', error);
      next(error);
    }
  }
);

// =========================================
// ROLE TEMPLATES MANAGEMENT
// =========================================

// Get all role templates
router.get('/role-templates',
  authenticateToken,
  requirePermission(Permission.USER_READ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const pool = db.getPool();
      const client = await pool.connect();
      
      try {
        await client.query('SET app.current_tenant_id = $1', [req.user!.tenant_id]);
        
        const result = await client.query(`
          SELECT rt.*, u.first_name, u.last_name 
          FROM role_templates rt
          LEFT JOIN users u ON rt.created_by = u.id
          WHERE rt.tenant_id = $1 OR rt.is_system_default = true
          ORDER BY rt.is_system_default DESC, rt.name ASC
        `, [req.user!.tenant_id]);
        
        res.json({
          success: true,
          data: result.rows.map(row => ({
            id: row.id,
            name: row.name,
            description: row.description,
            permissions: row.permissions,
            isSystemDefault: row.is_system_default,
            createdBy: row.first_name && row.last_name ? 
              `${row.first_name} ${row.last_name}` : 'System',
            createdAt: row.created_at,
            updatedAt: row.updated_at
          }))
        });
        
      } finally {
        client.release();
      }
      
    } catch (error) {
      logger.error('Failed to get role templates:', error);
      next(error);
    }
  }
);

// Create role template
router.post('/role-templates',
  authenticateToken,
  requirePermission(Permission.USER_UPDATE),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, description, permissions } = req.body;
      
      // Validate input
      if (!name || !Array.isArray(permissions)) {
        res.status(400).json({
          error: 'Name and permissions array are required',
          code: 'INVALID_INPUT'
        });
        return;
      }
      
      // Validate all permissions exist
      for (const permission of permissions) {
        if (!Object.values(Permission).includes(permission)) {
          res.status(400).json({
            error: `Invalid permission: ${permission}`,
            code: 'INVALID_PERMISSION'
          });
          return;
        }
      }
      
      const pool = db.getPool();
      const client = await pool.connect();
      
      try {
        await client.query('SET app.current_tenant_id = $1', [req.user!.tenant_id]);
        
        const result = await client.query(`
          INSERT INTO role_templates (tenant_id, name, description, permissions, created_by)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `, [req.user!.tenant_id, name, description, JSON.stringify(permissions), req.user!.id]);
        
        res.status(201).json({
          success: true,
          data: {
            id: result.rows[0].id,
            name: result.rows[0].name,
            description: result.rows[0].description,
            permissions: result.rows[0].permissions,
            createdAt: result.rows[0].created_at
          }
        });
        
      } finally {
        client.release();
      }
      
    } catch (error: any) {
      if (error.code === '23505') { // Unique violation
        res.status(409).json({
          error: 'Role template with this name already exists',
          code: 'TEMPLATE_EXISTS'
        });
        return;
      }
      
      logger.error('Failed to create role template:', error);
      next(error);
    }
  }
);

// =========================================
// AUDIT AND SECURITY LOGS
// =========================================

// Get permission audit logs
router.get('/audit/permissions',
  authenticateToken,
  requirePermission(Permission.AUDIT_READ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { 
        userId, 
        permission, 
        action, 
        startDate, 
        endDate, 
        limit = 100, 
        offset = 0 
      } = req.query;
      
      const pool = db.getPool();
      const client = await pool.connect();
      
      try {
        await client.query('SET app.current_tenant_id = $1', [req.user!.tenant_id]);
        
        let query = `
          SELECT pal.*, 
                 u1.first_name as user_first_name, u1.last_name as user_last_name,
                 u2.first_name as performed_by_first_name, u2.last_name as performed_by_last_name
          FROM permission_audit_log pal
          LEFT JOIN users u1 ON pal.user_id = u1.id
          LEFT JOIN users u2 ON pal.performed_by = u2.id
          WHERE pal.tenant_id = $1
        `;
        
        const params: any[] = [req.user!.tenant_id];
        let paramIndex = 2;
        
        if (userId) {
          query += ` AND pal.user_id = $${paramIndex}`;
          params.push(userId);
          paramIndex++;
        }
        
        if (permission) {
          query += ` AND pal.permission = $${paramIndex}`;
          params.push(permission);
          paramIndex++;
        }
        
        if (action) {
          query += ` AND pal.action = $${paramIndex}`;
          params.push(action);
          paramIndex++;
        }
        
        if (startDate) {
          query += ` AND pal.created_at >= $${paramIndex}`;
          params.push(startDate);
          paramIndex++;
        }
        
        if (endDate) {
          query += ` AND pal.created_at <= $${paramIndex}`;
          params.push(endDate);
          paramIndex++;
        }
        
        query += ` ORDER BY pal.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(parseInt(limit as string), parseInt(offset as string));
        
        const result = await client.query(query, params);
        
        res.json({
          success: true,
          data: {
            logs: result.rows.map(row => ({
              id: row.id,
              userId: row.user_id,
              userName: row.user_first_name && row.user_last_name ? 
                `${row.user_first_name} ${row.user_last_name}` : 'Unknown',
              permission: row.permission,
              action: row.action,
              performedBy: row.performed_by_first_name && row.performed_by_last_name ? 
                `${row.performed_by_first_name} ${row.performed_by_last_name}` : 'System',
              reason: row.reason,
              ipAddress: row.ip_address,
              userAgent: row.user_agent,
              createdAt: row.created_at
            })),
            pagination: {
              limit: parseInt(limit as string),
              offset: parseInt(offset as string),
              total: result.rows.length
            }
          }
        });
        
      } finally {
        client.release();
      }
      
    } catch (error) {
      logger.error('Failed to get audit logs:', error);
      next(error);
    }
  }
);

// Get security events
router.get('/security/events',
  authenticateToken,
  requirePermission(Permission.SECURITY_MANAGE),
  async (req: Request, res: Response, next: NextFunction) => {
    const { 
      eventType, 
      userId, 
      result, 
      startDate, 
      endDate, 
      limit = 100, 
      offset = 0 
    } = req.query;
    
    try {
      const pool = db.getPool();
      const client = await pool.connect();
      
      try {
        await client.query('SET app.current_tenant_id = $1', [req.user!.tenant_id]);
        
        let query = `
          SELECT se.*, u.first_name, u.last_name
          FROM security_events se
          LEFT JOIN users u ON se.user_id = u.id
          WHERE se.tenant_id = $1
        `;
        
        const params: any[] = [req.user!.tenant_id];
        let paramIndex = 2;
        
        if (eventType) {
          query += ` AND se.event_type = $${paramIndex}`;
          params.push(eventType);
          paramIndex++;
        }
        
        if (userId) {
          query += ` AND se.user_id = $${paramIndex}`;
          params.push(userId);
          paramIndex++;
        }
        
        if (result) {
          query += ` AND se.result = $${paramIndex}`;
          params.push(result);
          paramIndex++;
        }
        
        if (startDate) {
          query += ` AND se.created_at >= $${paramIndex}`;
          params.push(startDate);
          paramIndex++;
        }
        
        if (endDate) {
          query += ` AND se.created_at <= $${paramIndex}`;
          params.push(endDate);
          paramIndex++;
        }
        
        query += ` ORDER BY se.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(parseInt(limit as string), parseInt(offset as string));
        
        const result = await client.query(query, params);
        
        res.json({
          success: true,
          data: {
            events: result.rows.map(row => ({
              id: row.id,
              eventType: row.event_type,
              userId: row.user_id,
              userName: row.first_name && row.last_name ? 
                `${row.first_name} ${row.last_name}` : 'Unknown',
              resource: row.resource,
              permission: row.permission,
              result: row.result,
              ipAddress: row.ip_address,
              userAgent: row.user_agent,
              metadata: row.metadata,
              createdAt: row.created_at
            })),
            pagination: {
              limit: parseInt(limit as string),
              offset: parseInt(offset as string),
              total: result.rows.length
            }
          }
        });
        
      } finally {
        client.release();
      }
      
    } catch (error) {
      logger.error('Failed to get security events:', error);
      next(error);
    }
  }
);

// =========================================
// HELPER FUNCTIONS
// =========================================

async function logPermissionChange(
  tenantId: string,
  userId: string,
  permission: string,
  action: 'granted' | 'revoked',
  performedBy: string,
  reason?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  const pool = db.getPool();
  const client = await pool.connect();
  
  try {
    await client.query('SET app.current_tenant_id = $1', [tenantId]);
    
    await client.query(`
      INSERT INTO permission_audit_log 
      (tenant_id, user_id, permission, action, performed_by, reason, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [tenantId, userId, permission, action, performedBy, reason, ipAddress, userAgent]);
    
  } finally {
    client.release();
  }
}

export default router;
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Users, 
  Settings, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Plus, 
  Search,
  Clock,
  Eye,
  Lock
} from 'lucide-react';

interface Permission {
  name: string;
  description: string;
  category: string;
}

interface UserPermissions {
  userId: string;
  userName: string;
  userRole: string;
  permissions: string[];
  customPermissions?: string[];
  lastUpdated: string;
}

interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  permission: string;
  action: 'granted' | 'revoked';
  performedBy: string;
  reason?: string;
  createdAt: string;
}

interface SecurityEvent {
  id: string;
  eventType: string;
  userId?: string;
  userName?: string;
  resource?: string;
  permission?: string;
  result: 'allowed' | 'denied';
  ipAddress?: string;
  createdAt: string;
}

interface RoleTemplate {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isSystemDefault: boolean;
  createdBy: string;
  createdAt: string;
}

const PERMISSION_CATEGORIES: { [key: string]: string } = {
  'user': 'User Management',
  'order': 'Order Management',
  'restaurant': 'Restaurant Management',
  'finance': 'Financial Management',
  'analytics': 'Analytics & Reporting',
  'audit': 'Security & Compliance',
  'security': 'Security & Compliance',
  'encryption': 'Security & Compliance',
  'campaign': 'Campaign Management',
  'support': 'Support Management'
};

export const RBACManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for different sections
  const [userPermissions, setUserPermissions] = useState<UserPermissions[]>([]);
  const [roleTemplates, setRoleTemplates] = useState<RoleTemplate[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  
  // Selected user for permission management
  const [selectedUser, setSelectedUser] = useState<UserPermissions | null>(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('jwt_token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-tenant-id': 'default-tenant'
      };

      switch (activeTab) {
        case 'users':
          // Load user permissions would be implemented
          break;
        case 'templates':
          await loadRoleTemplates(headers);
          break;
        case 'audit':
          await loadAuditLogs(headers);
          break;
        case 'security':
          await loadSecurityEvents(headers);
          break;
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRoleTemplates = async (headers: any) => {
    const response = await fetch('/api/v1/rbac/role-templates', { headers });
    if (response.ok) {
      const data = await response.json();
      setRoleTemplates(data.data);
    }
  };

  const loadAuditLogs = async (headers: any) => {
    const response = await fetch('/api/v1/rbac/audit/permissions', { headers });
    if (response.ok) {
      const data = await response.json();
      setAuditLogs(data.data.logs);
    }
  };

  const loadSecurityEvents = async (headers: any) => {
    const response = await fetch('/api/v1/rbac/security/events', { headers });
    if (response.ok) {
      const data = await response.json();
      setSecurityEvents(data.data.events);
    }
  };

  const grantPermission = async (userId: string, permission: string, reason?: string) => {
    try {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch(`/api/v1/rbac/users/${userId}/permissions/${permission}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'x-tenant-id': 'default-tenant'
        },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        await loadData();
      }
    } catch (error) {
      console.error('Error granting permission:', error);
    }
  };

  const revokePermission = async (userId: string, permission: string, reason?: string) => {
    try {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch(`/api/v1/rbac/users/${userId}/permissions/${permission}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'x-tenant-id': 'default-tenant'
        },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        await loadData();
      }
    } catch (error) {
      console.error('Error revoking permission:', error);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPermissionCategory = (permission: string) => {
    const category = permission.split(':')[0];
    return PERMISSION_CATEGORIES[category] || 'Other';
  };

  const getEventIcon = (eventType: string, result: string) => {
    if (result === 'denied') return <XCircle className="h-4 w-4 text-red-500" />;
    if (result === 'allowed') return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="h-8 w-8 text-blue-600" />
            Security & Access Control
          </h1>
          <p className="text-gray-600 mt-1">
            Manage user permissions, roles, and security monitoring
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search users, permissions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            User Permissions
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Role Templates
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Audit Logs
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Security Events
          </TabsTrigger>
        </TabsList>

        {/* User Permissions Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Permission Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-gray-500 py-8">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>User permissions management interface would be implemented here</p>
                <p className="text-sm">This would show a list of users with their current permissions</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Role Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Role Templates</h2>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Template
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roleTemplates.map((template) => (
              <Card key={template.id} className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      {template.isSystemDefault && (
                        <Badge variant="outline" className="mt-1">System Default</Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{template.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Permissions ({template.permissions.length})
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {template.permissions.slice(0, 3).map((permission) => (
                          <Badge key={permission} variant="outline" className="text-xs">
                            {permission}
                          </Badge>
                        ))}
                        {template.permissions.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{template.permissions.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>Created by {template.createdBy}</span>
                      <span>{formatDateTime(template.createdAt)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {roleTemplates.length === 0 && !loading && (
            <Card>
              <CardContent className="text-center py-8">
                <Settings className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">No role templates found</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Audit Logs Tab */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Permission Change Audit Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {auditLogs.map((log) => (
                  <div key={log.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {log.action === 'granted' ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="font-medium">
                            Permission {log.action}
                          </span>
                          <Badge variant="outline">{log.permission}</Badge>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-1">
                          User: <span className="font-medium">{log.userName}</span>
                        </p>
                        <p className="text-sm text-gray-600 mb-1">
                          By: <span className="font-medium">{log.performedBy}</span>
                        </p>
                        {log.reason && (
                          <p className="text-sm text-gray-600">
                            Reason: {log.reason}
                          </p>
                        )}
                      </div>
                      
                      <div className="text-right text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDateTime(log.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {auditLogs.length === 0 && !loading && (
                  <div className="text-center text-gray-500 py-8">
                    <Eye className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>No audit logs found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Events Tab */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Security Events Monitor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {securityEvents.map((event) => (
                  <div key={event.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getEventIcon(event.eventType, event.result)}
                          <span className="font-medium capitalize">
                            {event.eventType.replace('_', ' ')}
                          </span>
                          <Badge 
                            variant={event.result === 'allowed' ? 'default' : 'destructive'}
                          >
                            {event.result}
                          </Badge>
                        </div>
                        
                        {event.userName && (
                          <p className="text-sm text-gray-600 mb-1">
                            User: <span className="font-medium">{event.userName}</span>
                          </p>
                        )}
                        {event.resource && (
                          <p className="text-sm text-gray-600 mb-1">
                            Resource: <span className="font-medium">{event.resource}</span>
                          </p>
                        )}
                        {event.permission && (
                          <p className="text-sm text-gray-600 mb-1">
                            Permission: <Badge variant="outline">{event.permission}</Badge>
                          </p>
                        )}
                        {event.ipAddress && (
                          <p className="text-xs text-gray-500">
                            IP: {event.ipAddress}
                          </p>
                        )}
                      </div>
                      
                      <div className="text-right text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDateTime(event.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {securityEvents.length === 0 && !loading && (
                  <div className="text-center text-gray-500 py-8">
                    <Lock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>No security events found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {loading && (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
};
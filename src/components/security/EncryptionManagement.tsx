import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Lock, 
  Unlock, 
  Key, 
  Database, 
  Globe, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  Eye,
  Download,
  Settings
} from 'lucide-react';

interface EncryptionStatus {
  component: string;
  type: 'data_at_rest' | 'data_in_transit' | 'backup' | 'logs';
  status: 'encrypted' | 'not_encrypted' | 'partially_encrypted' | 'error';
  algorithm: string;
  keyRotationDate?: string;
  nextRotationDate?: string;
  encryptionStrength: string;
  complianceStandards: string[];
  lastChecked: string;
}

interface EncryptionKey {
  id: string;
  name: string;
  type: 'master' | 'data' | 'backup' | 'transit';
  algorithm: string;
  keyLength: number;
  status: 'active' | 'rotating' | 'deprecated' | 'compromised';
  createdAt: string;
  lastUsed: string;
  rotationSchedule: string;
  usageCount: number;
}

interface EncryptionEvent {
  id: string;
  timestamp: string;
  eventType: 'key_rotation' | 'encryption_failure' | 'key_generation' | 'compliance_check';
  component: string;
  details: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  resolved: boolean;
}

export const EncryptionManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [encryptionStatuses, setEncryptionStatuses] = useState<EncryptionStatus[]>([]);
  const [encryptionKeys, setEncryptionKeys] = useState<EncryptionKey[]>([]);
  const [encryptionEvents, setEncryptionEvents] = useState<EncryptionEvent[]>([]);
  const [overallHealth, setOverallHealth] = useState({
    score: 95,
    encrypted_components: 8,
    total_components: 10,
    critical_issues: 0,
    warnings: 2
  });

  useEffect(() => {
    loadEncryptionData();
  }, []);

  const loadEncryptionData = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would fetch from API
      // For now, we'll use mock data to demonstrate the interface
      setEncryptionStatuses([
        {
          component: 'User Database',
          type: 'data_at_rest',
          status: 'encrypted',
          algorithm: 'AES-256-GCM',
          keyRotationDate: '2025-07-15T10:30:00Z',
          nextRotationDate: '2025-10-15T10:30:00Z',
          encryptionStrength: 'Strong',
          complianceStandards: ['GDPR', 'PCI DSS', 'SOX'],
          lastChecked: '2025-07-29T14:00:00Z'
        },
        {
          component: 'Payment Data',
          type: 'data_at_rest',
          status: 'encrypted',
          algorithm: 'AES-256-GCM',
          keyRotationDate: '2025-07-20T08:15:00Z',
          nextRotationDate: '2025-08-20T08:15:00Z',
          encryptionStrength: 'Strong',
          complianceStandards: ['PCI DSS'],
          lastChecked: '2025-07-29T14:00:00Z'
        },
        {
          component: 'API Communications',
          type: 'data_in_transit',
          status: 'encrypted',
          algorithm: 'TLS 1.3',
          encryptionStrength: 'Strong',
          complianceStandards: ['GDPR', 'PCI DSS'],
          lastChecked: '2025-07-29T14:00:00Z'
        },
        {
          component: 'Database Backups',
          type: 'backup',
          status: 'encrypted',
          algorithm: 'AES-256-CBC',
          keyRotationDate: '2025-07-10T12:00:00Z',
          nextRotationDate: '2025-10-10T12:00:00Z',
          encryptionStrength: 'Strong',
          complianceStandards: ['GDPR', 'SOX'],
          lastChecked: '2025-07-29T14:00:00Z'
        },
        {
          component: 'Application Logs',
          type: 'logs',
          status: 'partially_encrypted',
          algorithm: 'AES-128-GCM',
          encryptionStrength: 'Medium',
          complianceStandards: ['GDPR'],
          lastChecked: '2025-07-29T14:00:00Z'
        },
        {
          component: 'Session Storage',
          type: 'data_at_rest',
          status: 'not_encrypted',
          algorithm: 'None',
          encryptionStrength: 'None',
          complianceStandards: [],
          lastChecked: '2025-07-29T14:00:00Z'
        }
      ]);

      setEncryptionKeys([
        {
          id: 'key-master-001',
          name: 'Primary Master Key',
          type: 'master',
          algorithm: 'AES-256',
          keyLength: 256,
          status: 'active',
          createdAt: '2025-01-15T10:00:00Z',
          lastUsed: '2025-07-29T13:45:00Z',
          rotationSchedule: 'Quarterly',
          usageCount: 156789
        },
        {
          id: 'key-data-001',
          name: 'User Data Encryption Key',
          type: 'data',
          algorithm: 'AES-256',
          keyLength: 256,
          status: 'active',
          createdAt: '2025-07-15T10:30:00Z',
          lastUsed: '2025-07-29T13:50:00Z',
          rotationSchedule: 'Monthly',
          usageCount: 45632
        },
        {
          id: 'key-backup-001',
          name: 'Backup Encryption Key',
          type: 'backup',
          algorithm: 'AES-256',
          keyLength: 256,
          status: 'active',
          createdAt: '2025-07-10T12:00:00Z',
          lastUsed: '2025-07-29T02:00:00Z',
          rotationSchedule: 'Quarterly',
          usageCount: 28
        }
      ]);

      setEncryptionEvents([
        {
          id: 'event-001',
          timestamp: '2025-07-29T10:30:00Z',
          eventType: 'compliance_check',
          component: 'Payment Data',
          details: 'PCI DSS compliance check passed',
          severity: 'info',
          resolved: true
        },
        {
          id: 'event-002',
          timestamp: '2025-07-29T08:15:00Z',
          eventType: 'encryption_failure',
          component: 'Session Storage',
          details: 'Encryption not configured for session data',
          severity: 'warning',
          resolved: false
        },
        {
          id: 'event-003',
          timestamp: '2025-07-28T15:20:00Z',
          eventType: 'key_rotation',
          component: 'User Database',
          details: 'Data encryption key rotated successfully',
          severity: 'info',
          resolved: true
        }
      ]);

    } catch (error) {
      console.error('Error loading encryption data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'encrypted':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'partially_encrypted':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'not_encrypted':
        return <Unlock className="h-4 w-4 text-red-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Lock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'encrypted': 'default',
      'partially_encrypted': 'outline',
      'not_encrypted': 'destructive',
      'error': 'destructive'
    };
    
    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getKeyStatusBadge = (status: string) => {
    const variants = {
      'active': 'default',
      'rotating': 'outline',
      'deprecated': 'destructive',
      'compromised': 'destructive'
    };
    
    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-gray-400" />;
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

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Key className="h-8 w-8 text-blue-600" />
            Data Encryption Management
          </h1>
          <p className="text-gray-600 mt-1">
            Monitor and manage data encryption across all system components
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button onClick={loadEncryptionData} disabled={loading} className="flex items-center gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Status
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Overall Health Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Encryption Health</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getHealthColor(overallHealth.score)}`}>
              {overallHealth.score}%
            </div>
            <p className="text-xs text-muted-foreground">Overall system health</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Encrypted Components</CardTitle>
            <Lock className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {overallHealth.encrypted_components}/{overallHealth.total_components}
            </div>
            <p className="text-xs text-muted-foreground">Components encrypted</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {overallHealth.critical_issues}
            </div>
            <p className="text-xs text-muted-foreground">Require immediate attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warnings</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {overallHealth.warnings}
            </div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Encryption Status by Component */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Encryption Status by Component
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {encryptionStatuses.map((status, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(status.status)}
                    <div>
                      <h3 className="font-medium">{status.component}</h3>
                      <p className="text-sm text-gray-600 capitalize">
                        {status.type.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(status.status)}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Algorithm</p>
                    <p className="font-medium">{status.algorithm}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Strength</p>
                    <p className="font-medium">{status.encryptionStrength}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Compliance</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {status.complianceStandards.map((standard) => (
                        <Badge key={standard} variant="outline" className="text-xs">
                          {standard}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-600">Last Checked</p>
                    <p className="font-medium">{formatDateTime(status.lastChecked)}</p>
                  </div>
                </div>
                
                {status.nextRotationDate && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Next Key Rotation:</span>
                      <span className="font-medium">{formatDateTime(status.nextRotationDate)}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Encryption Keys Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Encryption Keys
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {encryptionKeys.map((key) => (
              <div key={key.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-medium">{key.name}</h3>
                    <p className="text-sm text-gray-600">
                      {key.algorithm} • {key.keyLength}-bit • {key.type} key
                    </p>
                  </div>
                  {getKeyStatusBadge(key.status)}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Created</p>
                    <p className="font-medium">{formatDateTime(key.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Last Used</p>
                    <p className="font-medium">{formatDateTime(key.lastUsed)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Rotation Schedule</p>
                    <p className="font-medium">{key.rotationSchedule}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Usage Count</p>
                    <p className="font-medium">{key.usageCount.toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t flex justify-between items-center">
                  <span className="text-sm text-gray-600">Key ID: {key.id}</span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Eye className="h-3 w-3 mr-1" />
                      Details
                    </Button>
                    <Button size="sm" variant="outline">
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Rotate
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Encryption Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Recent Encryption Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {encryptionEvents.map((event) => (
              <div key={event.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3 flex-1">
                    {getSeverityIcon(event.severity)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium capitalize">
                          {event.eventType.replace('_', ' ')}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {event.component}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{event.details}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{formatDateTime(event.timestamp)}</span>
                        <Badge variant={event.resolved ? 'default' : 'destructive'} className="text-xs">
                          {event.resolved ? 'Resolved' : 'Open'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {loading && (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
};
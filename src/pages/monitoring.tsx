import React from 'react';
import { SystemMonitor } from '@/components/monitoring/SystemMonitor';

export default function MonitoringPage() {
  // In a real app, these would come from authentication context
  const userToken = 'mock-admin-jwt-token';
  const tenantId = 'default-tenant';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <SystemMonitor
          userToken={userToken}
          tenantId={tenantId}
        />
      </div>
    </div>
  );
}
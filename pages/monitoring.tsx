import React from 'react';
import { SystemMonitor } from '@/components/monitoring/SystemMonitor';
import { useAuth } from '@/contexts/AuthContext';

export default function MonitoringPage() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Please log in to access monitoring</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <SystemMonitor
          userToken={user.id} // Use user ID instead of mock token
          tenantId={user.tenant_id}
        />
      </div>
    </div>
  );
}
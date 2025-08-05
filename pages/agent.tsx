import React from 'react';
import { AgentDashboard } from '@/components/chat/AgentDashboard';
import { useAuth } from '@/contexts/AuthContext';

export default function AgentPage() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Please log in to access agent dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <AgentDashboard
      agentId={user.id}
      agentToken={user.id} // Use user ID instead of mock token
      tenantId={user.tenant_id}
    />
  );
}
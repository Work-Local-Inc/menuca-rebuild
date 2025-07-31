import React from 'react';
import { AgentDashboard } from '@/components/chat/AgentDashboard';

export default function AgentPage() {
  // In a real app, these would come from authentication context
  const agentId = 'agent-123';
  const agentToken = 'mock-agent-jwt-token';
  const tenantId = 'default-tenant';

  return (
    <AgentDashboard
      agentId={agentId}
      agentToken={agentToken}
      tenantId={tenantId}
    />
  );
}
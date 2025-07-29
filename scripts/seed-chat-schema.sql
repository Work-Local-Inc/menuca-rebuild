-- Create chat sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
    id VARCHAR(255) PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL,
    customer_id UUID NOT NULL,
    agent_id UUID NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('waiting', 'active', 'resolved', 'abandoned')),
    priority VARCHAR(50) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
    subject TEXT,
    customer_info JSONB NOT NULL,
    queue_position INTEGER,
    estimated_wait_time INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id VARCHAR(255) PRIMARY KEY,
    chat_session_id VARCHAR(255) NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    sender_type VARCHAR(50) NOT NULL CHECK (sender_type IN ('customer', 'agent')),
    message TEXT NOT NULL,
    message_type VARCHAR(50) NOT NULL CHECK (message_type IN ('text', 'image', 'file', 'system')) DEFAULT 'text',
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- Create chat session ratings table (for post-chat feedback)
CREATE TABLE IF NOT EXISTS chat_session_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(255) NOT NULL,
    chat_session_id VARCHAR(255) NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL,
    agent_id UUID,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    feedback_text TEXT,
    category VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(chat_session_id)
);

-- Create agent performance metrics table
CREATE TABLE IF NOT EXISTS agent_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(255) NOT NULL,
    agent_id UUID NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_chats INTEGER DEFAULT 0,
    avg_response_time_seconds INTEGER DEFAULT 0,
    avg_session_duration_seconds INTEGER DEFAULT 0,
    customer_satisfaction_avg DECIMAL(3,2) DEFAULT 0.0,
    first_response_time_avg_seconds INTEGER DEFAULT 0,
    resolution_rate DECIMAL(5,2) DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, agent_id, date)
);

-- Enable RLS (Row Level Security)
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_session_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_performance ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY tenant_isolation_chat_sessions ON chat_sessions
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id'));

CREATE POLICY tenant_isolation_chat_messages ON chat_messages
    FOR ALL
    USING (EXISTS (
        SELECT 1 FROM chat_sessions cs 
        WHERE cs.id = chat_messages.chat_session_id 
        AND cs.tenant_id = current_setting('app.current_tenant_id')
    ));

CREATE POLICY tenant_isolation_chat_ratings ON chat_session_ratings
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id'));

CREATE POLICY tenant_isolation_agent_performance ON agent_performance
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_sessions_tenant_id ON chat_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_customer_id ON chat_sessions(customer_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_agent_id ON chat_sessions(agent_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_status ON chat_sessions(status);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_created_at ON chat_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_last_activity ON chat_sessions(last_activity);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(chat_session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

CREATE INDEX IF NOT EXISTS idx_chat_ratings_session_id ON chat_session_ratings(chat_session_id);
CREATE INDEX IF NOT EXISTS idx_chat_ratings_agent_id ON chat_session_ratings(agent_id);

CREATE INDEX IF NOT EXISTS idx_agent_performance_agent_date ON agent_performance(agent_id, date);
CREATE INDEX IF NOT EXISTS idx_agent_performance_tenant_date ON agent_performance(tenant_id, date);

-- Insert sample data for testing
-- Sample chat session
INSERT INTO chat_sessions (
    id, tenant_id, customer_id, agent_id, status, priority, subject, customer_info, created_at, last_activity
) VALUES (
    'chat_sample_001',
    'default-tenant',
    'customer-001'::UUID,
    'agent-001'::UUID,
    'resolved',
    'medium',
    'Payment Issue',
    '{"name": "John Doe", "email": "john@example.com", "user_agent": "Mozilla/5.0"}',
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '1 hour'
) ON CONFLICT (id) DO NOTHING;

-- Sample chat messages
INSERT INTO chat_messages (id, chat_session_id, sender_id, sender_type, message, created_at) VALUES
(
    'msg_sample_001',
    'chat_sample_001',
    'customer-001'::UUID,
    'customer',
    'Hi, I''m having trouble with my payment. It keeps getting declined.',
    NOW() - INTERVAL '2 hours'
),
(
    'msg_sample_002',
    'chat_sample_001',
    'agent-001'::UUID,
    'agent',
    'Hello! I''d be happy to help you with your payment issue. Can you tell me which payment method you''re trying to use?',
    NOW() - INTERVAL '2 hours' + INTERVAL '2 minutes'
),
(
    'msg_sample_003',
    'chat_sample_001',
    'customer-001'::UUID,
    'customer',
    'I''m using my Visa credit card ending in 1234.',
    NOW() - INTERVAL '2 hours' + INTERVAL '3 minutes'
),
(
    'msg_sample_004',
    'chat_sample_001',
    'agent-001'::UUID,
    'agent',
    'Thank you for that information. Let me check your account and payment settings. One moment please.',
    NOW() - INTERVAL '2 hours' + INTERVAL '4 minutes'
),
(
    'msg_sample_005',
    'chat_sample_001',
    'agent-001'::UUID,
    'agent',
    'I can see the issue. Your billing address doesn''t match what your bank has on file. Please update your billing address in your account settings and try again.',
    NOW() - INTERVAL '2 hours' + INTERVAL '7 minutes'
),
(
    'msg_sample_006',
    'chat_sample_001',
    'customer-001'::UUID,
    'customer',
    'Oh, that makes sense! I recently moved. Let me update that now. Thank you so much for your help!',
    NOW() - INTERVAL '2 hours' + INTERVAL '8 minutes'
)
ON CONFLICT (id) DO NOTHING;

-- Sample chat rating
INSERT INTO chat_session_ratings (
    tenant_id, chat_session_id, customer_id, agent_id, rating, feedback_text, category
) VALUES (
    'default-tenant',
    'chat_sample_001',
    'customer-001'::UUID,
    'agent-001'::UUID,
    5,
    'Excellent service! The agent was very helpful and solved my problem quickly.',
    'payment_support'
) ON CONFLICT (chat_session_id) DO NOTHING;

-- Sample agent performance data
INSERT INTO agent_performance (
    tenant_id, agent_id, date, total_chats, avg_response_time_seconds, 
    avg_session_duration_seconds, customer_satisfaction_avg, first_response_time_avg_seconds, resolution_rate
) VALUES (
    'default-tenant',
    'agent-001'::UUID,
    CURRENT_DATE,
    15,
    45,
    720,
    4.7,
    30,
    92.5
) ON CONFLICT (tenant_id, agent_id, date) DO UPDATE SET
    total_chats = EXCLUDED.total_chats,
    avg_response_time_seconds = EXCLUDED.avg_response_time_seconds,
    avg_session_duration_seconds = EXCLUDED.avg_session_duration_seconds,
    customer_satisfaction_avg = EXCLUDED.customer_satisfaction_avg,
    first_response_time_avg_seconds = EXCLUDED.first_response_time_avg_seconds,
    resolution_rate = EXCLUDED.resolution_rate,
    updated_at = NOW();

-- Create a function to automatically update agent performance metrics
CREATE OR REPLACE FUNCTION update_agent_performance()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update when chat session is resolved
    IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
        INSERT INTO agent_performance (tenant_id, agent_id, date, total_chats)
        VALUES (NEW.tenant_id, NEW.agent_id, CURRENT_DATE, 1)
        ON CONFLICT (tenant_id, agent_id, date) 
        DO UPDATE SET 
            total_chats = agent_performance.total_chats + 1,
            updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic performance tracking
DROP TRIGGER IF EXISTS trigger_update_agent_performance ON chat_sessions;
CREATE TRIGGER trigger_update_agent_performance
    AFTER UPDATE ON chat_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_agent_performance();
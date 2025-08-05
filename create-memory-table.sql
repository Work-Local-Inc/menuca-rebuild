-- Create memory bank table for MCP muscle memory
CREATE TABLE IF NOT EXISTS memory_bank (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    context JSONB,
    importance INTEGER DEFAULT 1 CHECK (importance >= 1 AND importance <= 5)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_memory_bank_title ON memory_bank(title);
CREATE INDEX IF NOT EXISTS idx_memory_bank_tags ON memory_bank USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_memory_bank_created_at ON memory_bank(created_at);
CREATE INDEX IF NOT EXISTS idx_memory_bank_importance ON memory_bank(importance);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_memory_bank_updated_at
    BEFORE UPDATE ON memory_bank
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert initial memory entries
INSERT INTO memory_bank (title, content, tags, importance) VALUES
('Project Overview', 'MenuCA-rebuild project is a multi-tenant SaaS platform for restaurant management using Supabase + Vercel stack. The project has comprehensive backend with 67 API endpoints including authentication, payment processing, order management, analytics, and real-time features. Current frontend is prototype level and needs rebuilding to integrate with the enterprise backend.', ARRAY['project', 'overview', 'architecture'], 5),
('Technology Stack', 'Database: Supabase PostgreSQL (https://fsjodpnptdbwaigzkmfl.supabase.co), Frontend/Backend: Vercel with Next.js, Configuration files: vercel.json, next.config.js, lib/supabase.ts. Uses MCP (Model Context Protocol) for memory bank functionality.', ARRAY['technology', 'stack', 'supabase', 'vercel'], 5),
('Memory Bank Initialization', 'Memory bank system has been initialized with MCP server. Uses Supabase table for persistent storage of project context, decisions, and ongoing work status.', ARRAY['memory', 'mcp', 'initialization'], 4);
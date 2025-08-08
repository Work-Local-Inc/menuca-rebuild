const { spawn } = require('child_process');

const mcpProcess = spawn('docker', [
  'run', '--rm', '-i',
  '-e', 'SUPABASE_URL=https://fsjodpnptdbwaigzkmfl.supabase.co',
  '-e', 'SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzam9kcG5wdGRid2FpZ3prbWZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzkwMzYwNCwiZXhwIjoyMDY5NDc5NjA0fQ.wdIdJ0oD7_ULyv23Mz2RL7hhI2ufe8DcFNTqLpJkQEw',
  '-e', 'DATABASE_URL=postgresql://postgres:tje*zvt1rwg.puv0GACm@db.fsjodpnptdbwaigzkmfl.supabase.co:5432/postgres?sslmode=require',
  'mcp/supabase'
]);

let initialized = false;
let requestId = 1;

mcpProcess.stdout.on('data', (data) => {
  const lines = data.toString().split('\n').filter(line => line.trim());
  
  for (const line of lines) {
    try {
      const response = JSON.parse(line);
      console.log('📨 Response:', JSON.stringify(response, null, 2));
      
      if (response.id === 1 && response.result) {
        initialized = true;
        console.log('✅ MCP initialized! Creating restaurants table...');
        
        // Create restaurants table
        const createTableSQL = `
          CREATE TABLE IF NOT EXISTS public.restaurants (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id VARCHAR(255) NOT NULL DEFAULT 'default-tenant',
            owner_id VARCHAR(255),
            name VARCHAR(255) NOT NULL,
            description TEXT,
            cuisine_type VARCHAR(100),
            address JSONB NOT NULL DEFAULT '{}',
            phone VARCHAR(20),
            email VARCHAR(255),
            website VARCHAR(255),
            operating_hours JSONB DEFAULT '{}',
            delivery_radius_km DECIMAL(5,2) DEFAULT 5.0,
            min_order_amount DECIMAL(10,2) DEFAULT 0.00,
            commission_rate DECIMAL(5,4),
            status VARCHAR(50) DEFAULT 'active',
            featured BOOLEAN DEFAULT FALSE,
            rating DECIMAL(3,2) DEFAULT 0.00,
            review_count INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `;
        
        const createTableRequest = {
          jsonrpc: "2.0",
          id: ++requestId,
          method: "tools/call",
          params: {
            name: "execute_sql",
            arguments: {
              sql: createTableSQL,
              fetch: false
            }
          }
        };
        
        mcpProcess.stdin.write(JSON.stringify(createTableRequest) + '\n');
      }
      
      if (response.id === 2) {
        console.log('🎉 Restaurants table creation result:', response);
        mcpProcess.kill();
      }
    } catch (e) {
      console.log('Raw output:', line);
    }
  }
});

mcpProcess.stderr.on('data', (data) => {
  console.error('❌ Error:', data.toString());
});

mcpProcess.on('close', (code) => {
  console.log(`✅ MCP process ended with code ${code}`);
});

// Initialize
console.log('🚀 Initializing MCP...');
const initRequest = {
  jsonrpc: "2.0",
  id: requestId,
  method: "initialize",
  params: {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: {
      name: "claude-code",
      version: "1.0"
    }
  }
};

mcpProcess.stdin.write(JSON.stringify(initRequest) + '\n');
# 🚀 Supabase MCP Server Instructions

**NEVER FORGET THESE AGAIN!**

## MCP Server Status: ✅ LIVE with execute_sql capability

### Available Tools:
- `read_table_rows` - SELECT queries with filters
- `create_table_records` - INSERT data
- `update_table_records` - UPDATE data  
- `delete_table_records` - DELETE data
- `execute_sql` - **DDL/DML execution (CREATE TABLE, INSERT, etc.)**

### Connection Details:
- **Supabase URL**: `https://fsjodpnptdbwaigzkmfl.supabase.co`
- **Service Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzam9kcG5wdGRid2FpZ3prbWZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzkwMzYwNCwiZXhwIjoyMDY5NDc5NjA0fQ.wdIdJ0oD7_ULyv23Mz2RL7hhI2ufe8DcFNTqLpJkQEw`
- **Database URL**: `postgresql://postgres:tje*zvt1rwg.puv0GACm@db.fsjodpnptdbwaigzkmfl.supabase.co:5432/postgres?sslmode=require`
- **Transport**: stdio (NO HTTP ports)

### How to Use MCP:

#### Method 1: Direct JSON-RPC (Working!)
```bash
# Initialize first
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"claude-code","version":"1.0"}}}' | \
docker run --rm -i \
  -e SUPABASE_URL="https://fsjodpnptdbwaigzkmfl.supabase.co" \
  -e SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzam9kcG5wdGRid2FpZ3prbWZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzkwMzYwNCwiZXhwIjoyMDY5NDc5NjA0fQ.wdIdJ0oD7_ULyv23Mz2RL7hhI2ufe8DcFNTqLpJkQEw" \
  -e DATABASE_URL="postgresql://postgres:tje*zvt1rwg.puv0GACm@db.fsjodpnptdbwaigzkmfl.supabase.co:5432/postgres?sslmode=require" \
  mcp/supabase

# Then execute SQL
echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"execute_sql","arguments":{"sql":"CREATE TABLE test(id serial primary key, name text);","fetch":false}}}' | \
docker run --rm -i \
  -e SUPABASE_URL="https://fsjodpnptdbwaigzkmfl.supabase.co" \
  -e SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzam9kcG5wdGRid2FpZ3prbWZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzkwMzYwNCwiZXhwIjoyMDY5NDc5NjA0fQ.wdIdJ0oD7_ULyv23Mz2RL7hhI2ufe8DcFNTqLpJkQEw" \
  -e DATABASE_URL="postgresql://postgres:tje*zvt1rwg.puv0GACm@db.fsjodpnptdbwaigzkmfl.supabase.co:5432/postgres?sslmode=require" \
  mcp/supabase
```

#### Method 2: Claude/Cursor MCP Config (Recommended)
Add to MCP config:
```json
{
  "mcpServers": {
    "supabase": {
      "command": "docker",
      "args": ["run","--rm","-i","-e","SUPABASE_URL","-e","SUPABASE_SERVICE_KEY","-e","DATABASE_URL","mcp/supabase"],
      "env": {
        "SUPABASE_URL": "https://fsjodpnptdbwaigzkmfl.supabase.co",
        "SUPABASE_SERVICE_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzam9kcG5wdGRid2FpZ3prbWZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzkwMzYwNCwiZXhwIjoyMDY5NDc5NjA0fQ.wdIdJ0oD7_ULyv23Mz2RL7hhI2ufe8DcFNTqLpJkQEw",
        "DATABASE_URL": "postgresql://postgres:tje*zvt1rwg.puv0GACm@db.fsjodpnptdbwaigzkmfl.supabase.co:5432/postgres?sslmode=require"
      }
    }
  }
}
```

### Enterprise Schema Deployment Ready!
- ✅ Docker image rebuilt with `execute_sql` tool
- ✅ psycopg[binary] dependency added  
- ✅ Direct PostgreSQL connection capability
- ✅ Ready to deploy 4 enterprise tables + indexes

### Next Actions:
1. Use `execute_sql` to CREATE enterprise tables
2. Use `create_table_records` to insert Xtreme Pizza data
3. Use `read_table_rows` to validate deployment
4. Connect frontend to live database

**NO MORE MANUAL COPY-PASTE - WE'RE USING THE MCP!**
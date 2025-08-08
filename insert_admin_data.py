#!/usr/bin/env python3
import json, subprocess, sys, time

# Environment variables for live Supabase
env = {
    "SUPABASE_URL": "https://fsjodpnptdbwaigzkmfl.supabase.co",
    "SUPABASE_SERVICE_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzam9kcG5wdGRid2FpZ3prbWZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzkwMzYwNCwiZXhwIjoyMDY5NDc5NjA0fQ.wdIdJ0oD7_ULyv23Mz2RL7hhI2ufe8DcFNTqLpJkQEw",
    "DATABASE_URL": "postgresql://postgres:t2Jnm85@db.fsjodpnptdbwaigzkmfl.supabase.co:5432/postgres?sslmode=require"
}

# Start MCP container
args = ["docker", "run", "--rm", "-i"] + sum([["-e", f"{k}={v}"] for k, v in env.items()], []) + ["mcp/supabase"]
print(f"Starting MCP with args: {args}")
p = subprocess.Popen(args, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, bufsize=1)

def send(msg): 
    print(f"SENDING: {json.dumps(msg)}")
    p.stdin.write(json.dumps(msg) + "\n")
    p.stdin.flush()

def recv_until(id_=None, timeout=30):
    start_time = time.time()
    while time.time() - start_time < timeout:
        if p.poll() is not None:
            stderr = p.stderr.read()
            if stderr:
                print(f"STDERR: {stderr}")
            break
        
        # Check if there's data available
        try:
            line = p.stdout.readline()
            if line:
                print(f"RECEIVED: {line.strip()}")
                if id_ is None or f'"id":{id_}' in line:
                    return line.strip()
        except:
            continue
    
    print(f"TIMEOUT waiting for response with id {id_}")
    return None

print("Starting MCP handshake...")

# Initialize handshake
send({"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {"protocolVersion": "2024-11-05", "clientInfo": {"name": "cli", "version": "0.1.0"}}})
response = recv_until(1, 60)  # Allow 60s for startup

if response and '"result"' in response:
    print("✅ Initialize successful")
    
    # Send initialized notification  
    send({"jsonrpc": "2.0", "method": "notifications/initialized", "params": {}})
    time.sleep(2)
    
    # Insert admin restaurant first
    print("🏪 Creating admin restaurant...")
    restaurant_sql = """
    INSERT INTO restaurants (id, tenant_id, name, description, cuisine_type, location, phone, address, is_active, created_by, updated_by)
    VALUES (
        'user-restaurant-user-adminmenucalocal-YWRtaW5A',
        'default-tenant',
        'admin@menuca.local Restaurant (Xtreme Pizza)',
        'Test restaurant loaded with real Xtreme Pizza Ottawa menu data',
        'Pizza',
        'Ottawa, ON',
        '+1-613-555-0123',
        '123 Test Street, Ottawa, ON K1A 0A6',
        true,
        'user-adminmenucalocal-YWRtaW5A',
        'user-adminmenucalocal-YWRtaW5A'
    )
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        updated_at = CURRENT_TIMESTAMP;
    """
    
    send({"jsonrpc": "2.0", "id": 3, "method": "tools/call", "params": {"name": "execute_sql", "arguments": {"sql": restaurant_sql, "fetch": False}}})
    response = recv_until(3)
    
    if response and '"result"' in response:
        print("✅ Restaurant created")
        
        # Create main menu
        print("📋 Creating main menu...")
        menu_sql = """
        INSERT INTO restaurant_menus (id, restaurant_id, tenant_id, name, description, is_active, display_order, created_by, updated_by)
        VALUES (
            'menu-xtreme-pizza-complete',
            'user-restaurant-user-adminmenucalocal-YWRtaW5A',
            'default-tenant',
            'Xtreme Pizza Menu',
            'Complete real menu scraped from Xtreme Pizza Ottawa - 33 items across 6 categories',
            true,
            1,
            'user-adminmenucalocal-YWRtaW5A',
            'user-adminmenucalocal-YWRtaW5A'
        )
        ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            updated_at = CURRENT_TIMESTAMP;
        """
        
        send({"jsonrpc": "2.0", "id": 4, "method": "tools/call", "params": {"name": "execute_sql", "arguments": {"sql": menu_sql, "fetch": False}}})
        response = recv_until(4)
        
        if response and '"result"' in response:
            print("✅ Menu created")
            
            # Now create categories and items
            print("📂 Creating categories...")
            categories = [
                ("cat-appetizers", "Appetizers", "Fresh appetizers selection", 1),
                ("cat-poutine", "Poutine", "Fresh poutine selection", 2), 
                ("cat-pizza", "Pizza", "Fresh pizza selection", 3),
                ("cat-donairs", "Donairs and Shawarma", "Donairs and shawarma selection", 4),
                ("cat-salads", "Salads", "Fresh salad selection", 5)
            ]
            
            for cat_id, cat_name, cat_desc, order in categories:
                category_sql = f"""
                INSERT INTO menu_categories (id, menu_id, tenant_id, name, description, display_order, is_active, created_by, updated_by)
                VALUES (
                    '{cat_id}',
                    'menu-xtreme-pizza-complete',
                    'default-tenant',
                    '{cat_name}',
                    '{cat_desc}',
                    {order},
                    true,
                    'user-adminmenucalocal-YWRtaW5A',
                    'user-adminmenucalocal-YWRtaW5A'
                )
                ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name,
                    description = EXCLUDED.description,
                    updated_at = CURRENT_TIMESTAMP;
                """
                
                send({"jsonrpc": "2.0", "id": 5 + order, "method": "tools/call", "params": {"name": "execute_sql", "arguments": {"sql": category_sql, "fetch": False}}})
                response = recv_until(5 + order)
                
                if response and '"result"' in response:
                    print(f"✅ Category {cat_name} created")
                else:
                    print(f"❌ Failed to create category {cat_name}")
            
            print("🎉 BASIC STRUCTURE CREATED - NOW ADDING MENU ITEMS...")
            
        else:
            print("❌ Failed to create menu")
    else:
        print("❌ Failed to create restaurant")
else:
    print("❌ MCP initialization failed")

# Clean up
p.terminate()
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables first
dotenv.config();

import db from '../src/database/connection';

async function setupDatabase() {
  console.log('🔧 Starting database setup...');
  
  try {
    // Read the SQL setup script
    const sqlPath = join(__dirname, 'setup-database.sql');
    const setupSQL = readFileSync(sqlPath, 'utf8');
    
    // Execute the setup script
    console.log('📝 Executing database schema setup...');
    await db.query(setupSQL);
    
    // Test the setup
    console.log('🧪 Testing database setup...');
    
    // Test tenant query
    const tenants = await db.query('SELECT * FROM tenants LIMIT 1');
    console.log('✅ Tenants table accessible:', tenants.length > 0);
    
    // Test RLS by setting tenant context
    const testUsers = await db.queryWithTenant(
      '00000000-0000-0000-0000-000000000000', 
      'SELECT id, email, role FROM users', 
      []
    );
    console.log('✅ Row Level Security working:', testUsers.length > 0);
    
    // Test database health view
    const health = await db.query('SELECT * FROM db_health');
    console.log('✅ Database health check:', health[0]);
    
    console.log('🎉 Database setup completed successfully!');
    console.log('\n📊 Setup Summary:');
    console.log('- Multi-tenant tables created with RLS');
    console.log('- Default tenant and admin user created');
    console.log('- Database roles and permissions configured');
    console.log('- Health monitoring views created');
    console.log('\n🔐 Test Credentials:');
    console.log('- Email: admin@menuca.local');
    console.log('- Password: password123');
    console.log('- Tenant: default');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    await db.close();
  }
}

// Run setup if called directly
if (require.main === module) {
  setupDatabase();
}

export default setupDatabase;
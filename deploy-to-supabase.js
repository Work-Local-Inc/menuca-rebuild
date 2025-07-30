const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Supabase PostgreSQL connection with proper encoding
const password = encodeURIComponent('tje*zvt1rwg.puv0GACm');
const connectionString = `postgresql://postgres:${password}@db.fsjodpnptdbwaigzkmfl.supabase.co:5432/postgres`;

const client = new Client({
  connectionString: connectionString,
  ssl: { rejectUnauthorized: false }
});

async function deploySchema() {
  console.log('🚀 Deploying MenuCA schema to Supabase...');
  
  try {
    await client.connect();
    console.log('✅ Connected to Supabase PostgreSQL');
    
    // Read the main setup SQL file
    const setupSQL = fs.readFileSync(path.join(__dirname, 'scripts', 'setup-database.sql'), 'utf8');
    
    console.log('📝 Executing main database setup...');
    
    // Execute the full SQL script
    await client.query(setupSQL);
    console.log('✅ Main schema deployed successfully!');
    
    // Deploy additional schema files
    const schemaFiles = [
      'create-restaurant-schema.sql',
      'create-rbac-tables.sql',
      'phase2-schema-extension.sql',
      'payment-schema-extension.sql',
      'commission-schema-extension.sql'
    ];
    
    for (const file of schemaFiles) {
      const filePath = path.join(__dirname, 'scripts', file);
      if (fs.existsSync(filePath)) {
        console.log(`📝 Deploying ${file}...`);
        const sql = fs.readFileSync(filePath, 'utf8');
        await client.query(sql);
        console.log(`✅ ${file} deployed!`);
      }
    }
    
    // Test the deployment
    console.log('🧪 Testing deployment...');
    const result = await client.query('SELECT * FROM tenants LIMIT 1');
    console.log('✅ Database test successful!');
    console.log(`Found ${result.rows.length} tenants in database`);
    
    console.log('🎉 Supabase deployment complete!');
    console.log('📊 Next steps:');
    console.log('1. Configure environment variables for Vercel');
    console.log('2. Deploy Next.js app to Vercel');
    console.log('3. Test the live application');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

deploySchema();
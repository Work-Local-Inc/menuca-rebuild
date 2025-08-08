const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function deploySchema() {
  console.log('🚀 Starting full schema deployment to live Supabase...');
  
  const schemaFiles = [
    'scripts/setup-database.sql',
    'scripts/create-restaurant-schema.sql', 
    'scripts/phase2-schema-extension.sql',
    'scripts/commission-schema-extension.sql',
    'scripts/payment-schema-extension.sql',
    'scripts/analytics-schema-extension.sql'
  ];

  for (const filePath of schemaFiles) {
    if (fs.existsSync(filePath)) {
      console.log(`\n📄 Executing ${filePath}...`);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
        
        if (error) {
          console.error(`❌ Error executing ${filePath}:`, error);
        } else {
          console.log(`✅ Successfully executed ${filePath}`);
        }
      } catch (err) {
        console.error(`❌ Failed to execute ${filePath}:`, err.message);
      }
    } else {
      console.warn(`⚠️  File not found: ${filePath}`);
    }
  }
  
  console.log('\n🎉 Schema deployment completed!');
}

deploySchema().catch(console.error);
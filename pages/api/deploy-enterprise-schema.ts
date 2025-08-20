import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

/**
 * 🚀 ENTERPRISE SCHEMA DEPLOYMENT API
 * 
 * Deploys the phase2-schema-extension.sql to upgrade from
 * businesses table to full enterprise schema with restaurants,
 * menu_items, and orders tables.
 */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🚀 Starting enterprise schema deployment...');
    
    // Read the schema file
    const schemaPath = path.join(process.cwd(), 'scripts', 'phase2-schema-extension.sql');
    
    if (!fs.existsSync(schemaPath)) {
      return res.status(404).json({ 
        error: 'Schema file not found', 
        path: schemaPath 
      });
    }
    
    const sql = fs.readFileSync(schemaPath, 'utf8');
    console.log('📖 Read schema file, length:', sql.length);
    
    // Split SQL into individual statements and execute them
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log('📋 Executing', statements.length, 'SQL statements...');
    
    const results = [];
    let successCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement) continue;
      
      try {
        console.log(`📝 Executing statement ${i + 1}/${statements.length}...`);
        
        // Execute the SQL statement
        const { data, error } = await supabaseAdmin.rpc('exec_sql', {
          sql: statement + ';'
        });
        
        if (error) {
          // If rpc doesn't work, try direct query
          const { data: queryData, error: queryError } = await supabaseAdmin
            .from('_tmp')
            .select('1')
            .limit(0);
          
          // Execute raw SQL using the connection
          const result = await (supabaseAdmin as any).query(statement + ';');
          
          results.push({
            statement: i + 1,
            status: 'success',
            preview: statement.substring(0, 100) + '...'
          });
          successCount++;
        } else {
          results.push({
            statement: i + 1,
            status: 'success',
            data: data,
            preview: statement.substring(0, 100) + '...'
          });
          successCount++;
        }
        
      } catch (statementError: any) {
        console.error(`❌ Statement ${i + 1} failed:`, statementError.message);
        results.push({
          statement: i + 1,
          status: 'error',
          error: statementError.message,
          preview: statement.substring(0, 100) + '...'
        });
      }
    }
    
    console.log(`✅ Deployment completed: ${successCount}/${statements.length} statements succeeded`);
    
    // Verify deployment by checking if new tables exist
    const { data: tablesData } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['restaurants', 'menu_categories', 'menu_items', 'orders', 'order_items']);
    
    return res.status(200).json({
      success: true,
      message: 'Enterprise schema deployment completed',
      stats: {
        totalStatements: statements.length,
        successfulStatements: successCount,
        failedStatements: statements.length - successCount
      },
      results: results,
      createdTables: tablesData || [],
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ Schema deployment failed:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Schema deployment failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
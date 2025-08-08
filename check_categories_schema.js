// Check menu_categories and menu_items schema
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://fsjodpnptdbwaigzkmfl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzam9kcG5wdGRid2FpZ3prbWZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzkwMzYwNCwiZXhwIjoyMDY5NDc5NjA0fQ.wdIdJ0oD7_ULyv23Mz2RL7hhI2ufe8DcFNTqLpJkQEw'
);

async function checkCategoriesSchema() {
  try {
    console.log('🔍 Testing menu_categories insert...');
    
    // Try a simple insert to see what fields are actually available
    const { data, error } = await supabase
      .from('menu_categories')
      .insert({
        id: '00000000-0000-0000-0000-000000000001',
        menu_id: '22222222-2222-2222-2222-222222222222',
        name: 'Test Category',
        description: 'Test description',
        display_order: 1,
        is_active: true
      })
      .select();
    
    if (error) {
      console.error('Categories insert error:', error);
      
      // Try without optional fields
      console.log('🔍 Trying minimal insert...');
      const { data: data2, error: error2 } = await supabase
        .from('menu_categories')
        .insert({
          name: 'Test Category 2',
          menu_id: '22222222-2222-2222-2222-222222222222'
        })
        .select();
        
      if (error2) {
        console.error('Minimal insert error:', error2);
      } else {
        console.log('✅ Minimal insert succeeded:', data2);
      }
    } else {
      console.log('✅ Full insert succeeded:', data);
    }
    
    console.log('🔍 Testing menu_items insert...');
    
    const { data: itemData, error: itemError } = await supabase
      .from('menu_items')
      .insert({
        name: 'Test Item',
        category_id: '00000000-0000-0000-0000-000000000001',
        price: 9.99
      })
      .select();
    
    if (itemError) {
      console.error('Items insert error:', itemError);
    } else {
      console.log('✅ Items insert succeeded:', itemData);
    }
    
  } catch (error) {
    console.error('Schema check error:', error);
  }
}

checkCategoriesSchema();
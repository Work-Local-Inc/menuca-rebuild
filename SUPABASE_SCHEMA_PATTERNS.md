# 📊 **Supabase Database Schema Patterns for Restaurant Systems**

## 🎯 **Overview**
This document outlines best practices for designing Supabase database schemas for restaurant/menu management systems, based on research and the MenuCA implementation.

## 🏗️ **Core Architecture Principles**

### **1. Declarative Schema Management**
- **Pattern**: Define database structure in `.sql` files representing the desired end state
- **Benefits**: Centralized schema management, simplified version control, easier collaboration
- **Implementation**: Store schema files in `sql/` directory with migration scripts

### **2. Multi-Tenant Design**
```sql
-- Every table should include tenant_id for isolation
CREATE TABLE restaurants (
  id uuid PRIMARY KEY,
  tenant_id text NOT NULL,  -- Critical for multi-tenancy
  name text NOT NULL,
  -- ... other fields
);

-- Indexes for performance
CREATE INDEX idx_restaurants_tenant_id ON restaurants(tenant_id);
```

### **3. Foreign Key Hierarchy**
```sql
-- Proper referential integrity chain
restaurants (id) 
  ↓
restaurant_menus (restaurant_id) 
  ↓  
menu_categories (menu_id)
  ↓
menu_items (category_id)
```

## 📋 **Required Table Structure**

### **Menu Items Table Pattern**
Based on research, these fields are commonly required:

```sql
CREATE TABLE menu_items (
  id uuid PRIMARY KEY,
  category_id uuid NOT NULL REFERENCES menu_categories(id),
  tenant_id text NOT NULL,           -- Required for RLS
  name text NOT NULL,
  description text DEFAULT '',
  price decimal(10,2) NOT NULL,
  
  -- Common optional fields that may be required
  is_active boolean DEFAULT true,    -- Often required
  display_order integer DEFAULT 0,   -- Often required
  image_url text,
  dietary_tags text[],
  prep_time_minutes integer,
  
  -- Audit fields (recommended)
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### **Required Indexes**
```sql
-- Performance indexes
CREATE INDEX idx_menu_items_category_id ON menu_items(category_id);
CREATE INDEX idx_menu_items_tenant_id ON menu_items(tenant_id);
CREATE INDEX idx_menu_items_is_active ON menu_items(is_active);
CREATE INDEX idx_menu_items_display_order ON menu_items(display_order);
```

## 🔒 **Row Level Security (RLS) Patterns**

### **Enable RLS on All Tables**
```sql
-- Enable RLS
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

-- Example policies
CREATE POLICY "tenant_isolation" ON menu_items
  FOR ALL USING (tenant_id = current_setting('app.current_tenant'));

CREATE POLICY "public_read_active_items" ON menu_items
  FOR SELECT USING (is_active = true);
```

### **Service Role vs Anon Key Usage**
- **Service Role**: Server-side operations, bypasses RLS
- **Anon Key**: Client-side operations, respects RLS policies
- **Best Practice**: Use service role for admin operations, anon key for public access

## 🚀 **Performance Optimization**

### **Connection Pooling**
```javascript
const supabase = createClient(url, key, {
  db: {
    schema: 'public',
  },
  auth: {
    autoRefreshToken: true,
    persistSession: false
  },
  global: {
    headers: { 'x-my-custom-header': 'my-app-name' },
  },
})
```

### **Query Optimization**
- Use `select()` to limit returned columns
- Add proper indexes for foreign keys
- Use `single()` when expecting one result
- Implement proper error handling

## 🔍 **Common Issues & Solutions**

### **1. Silent Insertion Failures**
**Problem**: Menu items fail to insert without clear error messages

**Solutions**:
- Check all required fields are provided
- Verify foreign key references exist
- Ensure RLS policies allow insertion
- Add comprehensive logging with detailed error capture

### **2. Missing Required Fields**
**Common Missing Fields**:
- `tenant_id` (for RLS)
- `is_active` (often required)
- `display_order` (for sorting)
- `created_at`/`updated_at` (audit trails)

### **3. Foreign Key Constraint Violations**
**Debug Steps**:
```sql
-- Check if parent record exists
SELECT id FROM menu_categories WHERE id = 'your-category-id';

-- Verify foreign key constraints
SELECT * FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY' 
AND table_name = 'menu_items';
```

## 📊 **MenuCA Implementation Example**

### **Working Data Flow**
```javascript
// 1. Create restaurant_menus record first
const menuId = uuidv4();
const { data: createdMenu } = await supabase
  .from('restaurant_menus')
  .insert({
    id: menuId,
    restaurant_id: restaurantId,
    tenant_id: tenantId,
    name: 'Main Menu',
    is_active: true,
    display_order: 1
  })
  .select()
  .single();

// 2. Create categories with proper menu_id
const { data: createdCategory } = await supabase
  .from('menu_categories')
  .insert({
    id: categoryId,
    menu_id: createdMenu.id,  // Use actual menu ID
    name: category.name,
    display_order: categoryIndex,
    is_active: true
  })
  .select()
  .single();

// 3. Create items with all required fields
const { data: createdItem } = await supabase
  .from('menu_items')
  .insert({
    id: itemId,
    category_id: createdCategory.id,  // Use actual category ID
    tenant_id: tenantId,              // Required for RLS
    name: item.name,
    description: item.description || '',
    price: basePrice,
    is_active: true,                  // Often required
    display_order: itemIndex          // Often required
  })
  .select()
  .single();
```

## 🛠️ **Debugging Tools**

### **1. Enhanced Logging Pattern**
```javascript
console.log(`🚀 Inserting item with data:`, JSON.stringify(itemData, null, 2));

if (itemError) {
  console.error(`❌ Item creation error:`, JSON.stringify(itemError, null, 2));
  console.error(`❌ Failed item data:`, JSON.stringify(itemData, null, 2));
  console.error(`❌ Category ID used: ${createdCategory.id}`);
}
```

### **2. Direct Database Inspection**
```sql
-- Check table structure
\d menu_items

-- Check constraints
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'menu_items';

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'menu_items';
```

## 📚 **Best Practices Summary**

1. **Always include `tenant_id`** for multi-tenant RLS
2. **Use declarative schema management** with `.sql` files
3. **Enable RLS on all user-facing tables**
4. **Add proper indexes** for foreign keys and query patterns
5. **Include audit fields** (`created_at`, `updated_at`)
6. **Use service role for admin operations**, anon key for public access
7. **Implement comprehensive logging** for debugging
8. **Test foreign key constraints** before bulk insertions
9. **Monitor query performance** with `pg_stat_statements`
10. **Use connection pooling** for production workloads

---

*Generated from research and MenuCA implementation experience*

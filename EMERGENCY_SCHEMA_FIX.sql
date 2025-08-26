-- 🚨 EMERGENCY FIX: Database has tenant_id as UUID but should be TEXT
-- The real onboarding is failing because schema mismatch

-- Check current schema first
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'restaurants' AND column_name = 'tenant_id';

-- If tenant_id is UUID, we need to fix it to TEXT
-- Option 1: Drop and recreate (if no important data)
ALTER TABLE public.restaurants DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE public.restaurants ADD COLUMN tenant_id text NOT NULL DEFAULT 'default-tenant';

-- Same for restaurant_menus  
ALTER TABLE public.restaurant_menus DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE public.restaurant_menus ADD COLUMN tenant_id text NOT NULL DEFAULT 'default-tenant';

-- Same for menu_items
ALTER TABLE public.menu_items DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE public.menu_items ADD COLUMN tenant_id text NOT NULL DEFAULT 'default-tenant';

-- Add back the indexes
CREATE INDEX IF NOT EXISTS idx_restaurants_tenant_id ON public.restaurants(tenant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_menus_tenant_id ON public.restaurant_menus(tenant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_tenant_id ON public.menu_items(tenant_id);

SELECT 'Fixed tenant_id columns to TEXT type for real onboarding!' as status;

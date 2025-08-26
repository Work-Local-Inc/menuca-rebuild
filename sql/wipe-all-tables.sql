-- ⚠️  WARNING: This will DELETE ALL TABLES and DATA in your Supabase project
-- Make sure you're running this on the correct project: nthpbtdjhhnwfxqsxbvy

-- Drop all existing tables if they exist
DROP TABLE IF EXISTS public.menu_items CASCADE;
DROP TABLE IF EXISTS public.menu_categories CASCADE;
DROP TABLE IF EXISTS public.restaurant_menus CASCADE;
DROP TABLE IF EXISTS public.restaurants CASCADE;
DROP TABLE IF EXISTS public.businesses CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop any other tables that might exist
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.items CASCADE;
DROP TABLE IF EXISTS public.menus CASCADE;

-- Drop any custom functions
DROP FUNCTION IF EXISTS public.set_updated_at() CASCADE;

-- Drop any custom types
DROP TYPE IF EXISTS public.order_status CASCADE;
DROP TYPE IF EXISTS public.payment_status CASCADE;

-- Clean slate confirmed
SELECT 'All tables dropped - database is now clean' as status;

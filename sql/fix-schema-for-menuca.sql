-- Fix schema to match MenuCA code expectations
-- Run this in your Supabase SQL Editor

-- 1. Create the missing menu_categories table
CREATE TABLE IF NOT EXISTS public.menu_categories (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  menu_id uuid REFERENCES public.restaurant_menus(id) ON DELETE CASCADE,
  name character varying NOT NULL,
  description text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Add missing tenant_id column to restaurant_menus table
ALTER TABLE public.restaurant_menus 
ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id);

-- 3. Add missing columns that our code expects
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS owner_id text,
ADD COLUMN IF NOT EXISTS website text,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active',
ADD COLUMN IF NOT EXISTS featured boolean DEFAULT false;

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_menu_categories_menu_id ON public.menu_categories(menu_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_menus_tenant_id ON public.restaurant_menus(tenant_id);

-- 5. Enable RLS on new table
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;

SELECT 'Schema fixed for MenuCA compatibility' as status;

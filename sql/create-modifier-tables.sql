-- 🍕 MODIFIER SYSTEM TABLES
-- Create the missing modifier tables for MenuCA
-- These are required for the modifier system to work across all restaurants

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. MODIFIER_GROUPS table
CREATE TABLE IF NOT EXISTS public.modifier_groups (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id text NOT NULL DEFAULT 'default-tenant',
  name text NOT NULL,
  min_selection integer DEFAULT 0,
  max_selection integer,
  required boolean DEFAULT false,
  display_order integer DEFAULT 0,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. MODIFIER_OPTIONS table
CREATE TABLE IF NOT EXISTS public.modifier_options (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  modifier_group_id uuid NOT NULL REFERENCES public.modifier_groups(id) ON DELETE CASCADE,
  name text NOT NULL,
  price_delta decimal(10,2) DEFAULT 0,
  display_order integer DEFAULT 0,
  quantity_allowed boolean DEFAULT false,
  max_per_option integer DEFAULT 1,
  default_selected boolean DEFAULT false,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. ITEM_MODIFIER_GROUPS table (links items to modifier groups)
CREATE TABLE IF NOT EXISTS public.item_modifier_groups (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id uuid NOT NULL, -- References items.id from the new schema
  modifier_group_id uuid NOT NULL REFERENCES public.modifier_groups(id) ON DELETE CASCADE,
  display_order integer DEFAULT 0,
  required boolean DEFAULT false,
  min_selection integer DEFAULT 0,
  max_selection integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(item_id, modifier_group_id)
);

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_modifier_groups_tenant_id ON public.modifier_groups(tenant_id);
CREATE INDEX IF NOT EXISTS idx_modifier_options_group_id ON public.modifier_options(modifier_group_id);
CREATE INDEX IF NOT EXISTS idx_item_modifier_groups_item_id ON public.item_modifier_groups(item_id);
CREATE INDEX IF NOT EXISTS idx_item_modifier_groups_group_id ON public.item_modifier_groups(modifier_group_id);

-- Enable RLS
ALTER TABLE public.modifier_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modifier_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_modifier_groups ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all for now - can be restricted later)
CREATE POLICY "Allow all access to modifier_groups" ON public.modifier_groups FOR ALL USING (true);
CREATE POLICY "Allow all access to modifier_options" ON public.modifier_options FOR ALL USING (true);
CREATE POLICY "Allow all access to item_modifier_groups" ON public.item_modifier_groups FOR ALL USING (true);

-- Create a function to clean up unused modifier options (used by import process)
CREATE OR REPLACE FUNCTION delete_unused_modifier_options(p_group_id uuid, p_keep_names text[])
RETURNS void AS $$
BEGIN
  DELETE FROM public.modifier_options 
  WHERE modifier_group_id = p_group_id 
  AND name NOT = ANY(p_keep_names);
END;
$$ LANGUAGE plpgsql;

SELECT 'Modifier tables created successfully! 🍕' as status;

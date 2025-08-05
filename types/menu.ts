// Comprehensive Menu Item Types - Based on Domino's/MOD Pizza functionality with clean structure

export interface MenuItemSize {
  id: string;
  name: string; // "Small", "Medium", "Large", "X-Large"
  diameter?: string; // "10\"", "12\"", "14\"", "16\""
  slices?: number; // 6, 8, 10, 12
  price_modifier: number; // Base price multiplier (1.0 for base, 1.5 for large, etc.)
  is_available: boolean;
}

export interface MenuItemCrust {
  id: string;
  name: string; // "Classic Hand-Tossed", "Thin & Crispy", "Thick Pan"
  description?: string;
  price_modifier: number; // Additional cost (0 for free, 2.00 for premium)
  preparation_time_modifier: number; // Additional prep time in minutes
  is_available: boolean;
  is_gluten_free?: boolean;
  is_vegan?: boolean;
}

export interface MenuItemSauce {
  id: string;
  name: string; // "Classic Tomato", "Garlic White", "BBQ", "Pesto"
  description?: string;
  price_modifier: number;
  is_available: boolean;
  is_spicy?: boolean;
  is_vegan?: boolean;
}

export interface MenuItemTopping {
  id: string;
  name: string;
  category: 'meat' | 'vegetable' | 'cheese' | 'premium' | 'sauce';
  description?: string;
  price_modifier: number; // Per topping cost
  is_available: boolean;
  allergens?: string[]; // ["dairy", "gluten", "nuts"]
  is_vegetarian?: boolean;
  is_vegan?: boolean;
  is_premium?: boolean; // Premium toppings cost more
}

export interface MenuItemCustomization {
  id: string;
  type: 'size' | 'crust' | 'sauce' | 'cheese' | 'toppings' | 'cooking_style';
  name: string;
  description?: string;
  is_required: boolean; // Must select one option
  allow_multiple: boolean; // Can select multiple options
  options: {
    id: string;
    name: string;
    price_modifier: number;
    is_default?: boolean;
  }[];
}

export interface ToppingPlacement {
  placement: 'whole' | 'left_half' | 'right_half';
  amount: 'light' | 'normal' | 'extra'; // Light = -25%, Normal = 100%, Extra = +50% cost
}

export interface MenuItemOption {
  // Core customization structure
  sizes: MenuItemSize[];
  crusts: MenuItemCrust[];
  sauces: MenuItemSauce[];
  toppings: MenuItemTopping[];
  
  // Advanced options
  customizations: MenuItemCustomization[];
  
  // Configuration
  allows_half_and_half: boolean;
  max_toppings?: number; // null = unlimited
  free_toppings_count?: number; // First N toppings free
  
  // Pricing structure
  base_price_by_size: Record<string, number>; // size_id -> base_price
  topping_pricing: {
    regular: number; // Regular topping price
    premium: number; // Premium topping price
    extra_cheese: number; // Extra cheese price
  };
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  
  // Pricing (now supports complex pricing)
  base_price: number; // Starting price for smallest size
  price_range?: {
    min: number;
    max: number;
  };
  cost: number; // Cost for restaurant (profit calculation)
  
  // Menu item configuration
  type: 'simple' | 'customizable'; // Simple = fixed item, Customizable = has options
  options?: MenuItemOption; // Only for customizable items
  
  // Media and presentation
  images: {
    id: string;
    url: string;
    alt_text?: string;
    is_primary?: boolean;
  }[];
  
  // Nutritional and dietary info
  nutritional_info?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    sodium?: number;
    fiber?: number;
  };
  allergens: string[];
  dietary_tags: string[]; // "vegetarian", "vegan", "gluten-free", "keto", etc.
  tags: string[]; // "popular", "new", "spicy", "chef-special"
  
  // Availability and operations
  availability: {
    is_available: boolean;
    available_days: number[]; // 0=Sunday, 6=Saturday
    available_times: Array<{
      start_time: string; // "09:00"
      end_time: string;   // "22:00"
    }>;
    stock_quantity?: number; // null = unlimited
    out_of_stock_message?: string;
  };
  
  // Restaurant management
  display_order: number;
  is_active: boolean;
  is_featured: boolean;
  preparation_time: number; // Base prep time in minutes
  
  // Metadata
  created_at: string;
  updated_at: string;
  created_by: string;
}

// Customer order structure (what gets added to cart)
export interface CartItem {
  menu_item_id: string;
  menu_item_name: string;
  base_price: number;
  quantity: number;
  
  // Selected customizations
  selected_size?: MenuItemSize;
  selected_crust?: MenuItemCrust;
  selected_sauce?: MenuItemSauce;
  selected_toppings: Array<{
    topping: MenuItemTopping;
    placement: ToppingPlacement;
  }>;
  selected_customizations: Record<string, string>; // customization_id -> option_id
  
  // Half and half configuration
  is_half_and_half: boolean;
  left_half_toppings?: MenuItemTopping[];
  right_half_toppings?: MenuItemTopping[];
  
  // Pricing breakdown
  size_price: number;
  crust_price: number;
  sauce_price: number;
  toppings_price: number;
  customizations_price: number;
  total_price: number;
  
  // Special instructions
  special_instructions?: string;
}

// Restaurant analytics and insights
export interface MenuItemAnalytics {
  menu_item_id: string;
  popular_combinations: Array<{
    size: string;
    crust: string;
    toppings: string[];
    order_count: number;
  }>;
  revenue_by_size: Record<string, number>;
  most_popular_toppings: Array<{
    topping_id: string;
    order_count: number;
    revenue: number;
  }>;
  profit_margins: {
    by_size: Record<string, number>;
    with_popular_toppings: number;
    overall: number;
  };
}

export default MenuItem;
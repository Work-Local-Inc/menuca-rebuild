import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Trash2, 
  Save, 
  X, 
  Pizza, 
  Layers, 
  Palette, 
  Star,
  DollarSign,
  Clock
} from 'lucide-react';
import { MenuItemOption, MenuItemSize, MenuItemCrust, MenuItemSauce, MenuItemTopping } from '@/types/menu';

interface MenuItemOptionsConfigProps {
  options: MenuItemOption | null;
  onSave: (options: MenuItemOption) => void;
  onCancel: () => void;
}

export const MenuItemOptionsConfig: React.FC<MenuItemOptionsConfigProps> = ({
  options,
  onSave,
  onCancel
}) => {
  // Create default config structure
  const defaultConfig: MenuItemOption = {
      sizes: [
        { id: 'small', name: 'Small', diameter: '10"', slices: 6, price_modifier: 1.0, is_available: true },
        { id: 'medium', name: 'Medium', diameter: '12"', slices: 8, price_modifier: 1.3, is_available: true },
        { id: 'large', name: 'Large', diameter: '14"', slices: 10, price_modifier: 1.6, is_available: true },
        { id: 'xlarge', name: 'X-Large', diameter: '16"', slices: 12, price_modifier: 2.0, is_available: true }
      ],
      crusts: [
        { id: 'classic', name: 'Classic Hand-Tossed', description: 'Our signature dough, crispy outside and chewy inside', price_modifier: 0, preparation_time_modifier: 0, is_available: true },
        { id: 'thin', name: 'Thin & Crispy', description: 'Ultra-thin crust that\'s perfectly crispy', price_modifier: 0, preparation_time_modifier: -2, is_available: true },
        { id: 'thick', name: 'Thick Pan', description: 'Deep dish style with golden crust', price_modifier: 1.5, preparation_time_modifier: 5, is_available: true },
        { id: 'gluten_free', name: 'Gluten-Free', description: 'Certified gluten-free crust', price_modifier: 3.0, preparation_time_modifier: 0, is_available: true, is_gluten_free: true }
      ],
      sauces: [
        { id: 'tomato', name: 'Classic Tomato', description: 'Traditional pizza sauce with herbs', price_modifier: 0, is_available: true },
        { id: 'white', name: 'Garlic White Sauce', description: 'Creamy garlic and herb base', price_modifier: 0.5, is_available: true },
        { id: 'bbq', name: 'BBQ Sauce', description: 'Sweet and tangy barbecue sauce', price_modifier: 0.5, is_available: true },
        { id: 'pesto', name: 'Basil Pesto', description: 'Fresh basil and pine nut pesto', price_modifier: 1.0, is_available: true, is_vegan: false }
      ],
      toppings: [
        // Meats
        { id: 'pepperoni', name: 'Pepperoni', category: 'meat', price_modifier: 1.5, is_available: true, allergens: [] },
        { id: 'sausage', name: 'Italian Sausage', category: 'meat', price_modifier: 1.5, is_available: true, allergens: [] },
        { id: 'bacon', name: 'Crispy Bacon', category: 'meat', price_modifier: 2.0, is_available: true, allergens: [] },
        { id: 'chicken', name: 'Grilled Chicken', category: 'meat', price_modifier: 2.5, is_available: true, allergens: [] },
        { id: 'prosciutto', name: 'Prosciutto', category: 'meat', price_modifier: 4.0, is_available: true, is_premium: true, allergens: [] },
        
        // Vegetables
        { id: 'mushrooms', name: 'Mushrooms', category: 'vegetable', price_modifier: 1.0, is_available: true, is_vegetarian: true, allergens: [] },
        { id: 'peppers', name: 'Bell Peppers', category: 'vegetable', price_modifier: 1.0, is_available: true, is_vegetarian: true, is_vegan: true, allergens: [] },
        { id: 'onions', name: 'Red Onions', category: 'vegetable', price_modifier: 0.5, is_available: true, is_vegetarian: true, is_vegan: true, allergens: [] },
        { id: 'olives', name: 'Black Olives', category: 'vegetable', price_modifier: 1.0, is_available: true, is_vegetarian: true, is_vegan: true, allergens: [] },
        { id: 'tomatoes', name: 'Fresh Tomatoes', category: 'vegetable', price_modifier: 1.0, is_available: true, is_vegetarian: true, is_vegan: true, allergens: [] },
        { id: 'arugula', name: 'Fresh Arugula', category: 'vegetable', price_modifier: 1.5, is_available: true, is_vegetarian: true, is_vegan: true, allergens: [] },
        
        // Cheeses
        { id: 'extra_mozzarella', name: 'Extra Mozzarella', category: 'cheese', price_modifier: 1.5, is_available: true, is_vegetarian: true, allergens: ['dairy'] },
        { id: 'parmesan', name: 'Parmesan', category: 'cheese', price_modifier: 1.0, is_available: true, is_vegetarian: true, allergens: ['dairy'] },
        { id: 'feta', name: 'Feta Cheese', category: 'cheese', price_modifier: 2.0, is_available: true, is_vegetarian: true, allergens: ['dairy'] },
        { id: 'goat_cheese', name: 'Goat Cheese', category: 'cheese', price_modifier: 3.0, is_available: true, is_premium: true, is_vegetarian: true, allergens: ['dairy'] }
      ],
      customizations: [],
      allows_half_and_half: true,
      max_toppings: null,
      free_toppings_count: 0,
      base_price_by_size: {
        small: 12.99,
        medium: 16.99,
        large: 19.99,
        xlarge: 24.99
      },
      topping_pricing: {
        regular: 1.50,
        premium: 3.00,
        extra_cheese: 2.00
      }
    };

  const [config, setConfig] = useState<MenuItemOption>(
    options ? {
      sizes: options.sizes || defaultConfig.sizes,
      crusts: options.crusts || defaultConfig.crusts,
      sauces: options.sauces || defaultConfig.sauces,
      toppings: options.toppings || defaultConfig.toppings,
      customizations: options.customizations || defaultConfig.customizations,
      allows_half_and_half: options.allows_half_and_half ?? defaultConfig.allows_half_and_half,
      max_toppings: options.max_toppings ?? defaultConfig.max_toppings,
      free_toppings_count: options.free_toppings_count ?? defaultConfig.free_toppings_count,
      base_price_by_size: options.base_price_by_size || defaultConfig.base_price_by_size,
      topping_pricing: options.topping_pricing || defaultConfig.topping_pricing
    } : defaultConfig
  );

  const handleSave = () => {
    onSave(config);
  };

  const addSize = () => {
    const newSize: MenuItemSize = {
      id: `size-${Date.now()}`,
      name: '',
      diameter: '',
      slices: 8,
      price_modifier: 1.0,
      is_available: true
    };
    setConfig(prev => ({
      ...prev,
      sizes: [...prev.sizes, newSize]
    }));
  };

  const updateSize = (index: number, field: keyof MenuItemSize, value: any) => {
    setConfig(prev => ({
      ...prev,
      sizes: prev.sizes.map((size, i) => 
        i === index ? { ...size, [field]: value } : size
      )
    }));
  };

  const deleteSize = (index: number) => {
    setConfig(prev => ({
      ...prev,
      sizes: prev.sizes.filter((_, i) => i !== index)
    }));
  };

  const addCrust = () => {
    const newCrust: MenuItemCrust = {
      id: `crust-${Date.now()}`,
      name: '',
      description: '',
      price_modifier: 0,
      preparation_time_modifier: 0,
      is_available: true
    };
    setConfig(prev => ({
      ...prev,
      crusts: [...prev.crusts, newCrust]
    }));
  };

  const updateCrust = (index: number, field: keyof MenuItemCrust, value: any) => {
    setConfig(prev => ({
      ...prev,
      crusts: prev.crusts.map((crust, i) => 
        i === index ? { ...crust, [field]: value } : crust
      )
    }));
  };

  const deleteCrust = (index: number) => {
    setConfig(prev => ({
      ...prev,
      crusts: prev.crusts.filter((_, i) => i !== index)
    }));
  };

  const addSauce = () => {
    const newSauce: MenuItemSauce = {
      id: `sauce-${Date.now()}`,
      name: '',
      description: '',
      price_modifier: 0,
      is_available: true
    };
    setConfig(prev => ({
      ...prev,
      sauces: [...prev.sauces, newSauce]
    }));
  };

  const updateSauce = (index: number, field: keyof MenuItemSauce, value: any) => {
    setConfig(prev => ({
      ...prev,
      sauces: prev.sauces.map((sauce, i) => 
        i === index ? { ...sauce, [field]: value } : sauce
      )
    }));
  };

  const deleteSauce = (index: number) => {
    setConfig(prev => ({
      ...prev,
      sauces: prev.sauces.filter((_, i) => i !== index)
    }));
  };

  const addTopping = () => {
    const newTopping: MenuItemTopping = {
      id: `topping-${Date.now()}`,
      name: '',
      category: 'vegetable',
      price_modifier: 1.0,
      is_available: true,
      allergens: []
    };
    setConfig(prev => ({
      ...prev,
      toppings: [...prev.toppings, newTopping]
    }));
  };

  const updateTopping = (index: number, field: keyof MenuItemTopping, value: any) => {
    setConfig(prev => ({
      ...prev,
      toppings: prev.toppings.map((topping, i) => 
        i === index ? { ...topping, [field]: value } : topping
      )
    }));
  };

  const deleteTopping = (index: number) => {
    setConfig(prev => ({
      ...prev,
      toppings: prev.toppings.filter((_, i) => i !== index)
    }));
  };

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Pizza className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <CardTitle className="text-xl text-gray-900">Menu Item Customization</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Configure sizes, crusts, sauces, and toppings for this menu item
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
              <Save className="h-4 w-4 mr-2" />
              Save Configuration
            </Button>
            <Button variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <Tabs defaultValue="sizes" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="sizes" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Sizes
            </TabsTrigger>
            <TabsTrigger value="crusts" className="flex items-center gap-2">
              <Pizza className="h-4 w-4" />
              Crusts
            </TabsTrigger>
            <TabsTrigger value="sauces" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Sauces
            </TabsTrigger>
            <TabsTrigger value="toppings" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Toppings
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Pricing
            </TabsTrigger>
          </TabsList>

          {/* SIZES TAB */}
          <TabsContent value="sizes" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Pizza Sizes</h3>
              <Button onClick={addSize} size="sm" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Size
              </Button>
            </div>
            
            <div className="grid gap-4">
              {config.sizes.map((size, index) => (
                <Card key={size.id} className="p-4 border-l-4 border-l-blue-500">
                  <div className="grid grid-cols-6 gap-4 items-center">
                    <div>
                      <label className="text-sm font-medium">Name</label>
                      <Input
                        value={size.name}
                        onChange={(e) => updateSize(index, 'name', e.target.value)}
                        placeholder="Small"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Diameter</label>
                      <Input
                        value={size.diameter || ''}
                        onChange={(e) => updateSize(index, 'diameter', e.target.value)}
                        placeholder="10&quot;"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Slices</label>
                      <Input
                        type="number"
                        value={size.slices || ''}
                        onChange={(e) => updateSize(index, 'slices', parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Price Multiplier</label>
                      <Input
                        type="number"
                        step="0.1"
                        value={size.price_modifier}
                        onChange={(e) => updateSize(index, 'price_modifier', parseFloat(e.target.value))}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={size.is_available}
                        onCheckedChange={(checked) => updateSize(index, 'is_available', checked)}
                      />
                      <label className="text-sm">Available</label>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteSize(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* SETTINGS TAB */}
          <TabsContent value="settings" className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Customization Settings</h3>
              
              <div className="grid grid-cols-2 gap-6">
                <Card className="p-4">
                  <h4 className="font-medium mb-3">Half & Half Options</h4>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={config.allows_half_and_half}
                      onCheckedChange={(checked) => setConfig(prev => ({ ...prev, allows_half_and_half: checked }))}
                    />
                    <label className="text-sm">Allow half & half pizzas</label>
                  </div>
                </Card>

                <Card className="p-4">
                  <h4 className="font-medium mb-3">Topping Limits</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium">Free Toppings Count</label>
                      <Input
                        type="number"
                        value={config.free_toppings_count || 0}
                        onChange={(e) => setConfig(prev => ({ 
                          ...prev, 
                          free_toppings_count: parseInt(e.target.value) || 0 
                        }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Max Toppings (0 = unlimited)</label>
                      <Input
                        type="number"
                        value={config.max_toppings || 0}
                        onChange={(e) => setConfig(prev => ({ 
                          ...prev, 
                          max_toppings: parseInt(e.target.value) || null 
                        }))}
                      />
                    </div>
                  </div>
                </Card>
              </div>

              <Card className="p-4 mt-6">
                <h4 className="font-medium mb-3">Topping Pricing</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">Regular Toppings</label>
                    <Input
                      type="number"
                      step="0.25"
                      value={config.topping_pricing.regular}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        topping_pricing: {
                          ...prev.topping_pricing,
                          regular: parseFloat(e.target.value)
                        }
                      }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Premium Toppings</label>
                    <Input
                      type="number"
                      step="0.25"
                      value={config.topping_pricing.premium}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        topping_pricing: {
                          ...prev.topping_pricing,
                          premium: parseFloat(e.target.value)
                        }
                      }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Extra Cheese</label>
                    <Input
                      type="number"
                      step="0.25"
                      value={config.topping_pricing.extra_cheese}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        topping_pricing: {
                          ...prev.topping_pricing,
                          extra_cheese: parseFloat(e.target.value)
                        }
                      }))}
                    />
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* CRUSTS TAB */}
          <TabsContent value="crusts" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Pizza Crusts</h3>
              <Button onClick={addCrust} size="sm" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Crust
              </Button>
            </div>
            
            <div className="grid gap-4">
              {config.crusts.map((crust, index) => (
                <Card key={crust.id} className="p-4 border-l-4 border-l-orange-500">
                  <div className="grid grid-cols-7 gap-4 items-start">
                    <div>
                      <label className="text-sm font-medium">Name</label>
                      <Input
                        value={crust.name}
                        onChange={(e) => updateCrust(index, 'name', e.target.value)}
                        placeholder="Hand-Tossed"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm font-medium">Description</label>
                      <Input
                        value={crust.description || ''}
                        onChange={(e) => updateCrust(index, 'description', e.target.value)}
                        placeholder="Crispy outside, chewy inside"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Price Modifier ($)</label>
                      <Input
                        type="number"
                        step="0.25"
                        value={crust.price_modifier}
                        onChange={(e) => updateCrust(index, 'price_modifier', parseFloat(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Prep Time (+/-min)</label>
                      <Input
                        type="number"
                        value={crust.preparation_time_modifier || 0}
                        onChange={(e) => updateCrust(index, 'preparation_time_modifier', parseInt(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={crust.is_available}
                          onCheckedChange={(checked) => updateCrust(index, 'is_available', checked)}
                        />
                        <label className="text-sm">Available</label>
                      </div>
                      {crust.is_gluten_free && (
                        <Badge className="bg-green-100 text-green-800 text-xs">Gluten-Free</Badge>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteCrust(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={crust.is_gluten_free || false}
                        onCheckedChange={(checked) => updateCrust(index, 'is_gluten_free', checked)}
                      />
                      <label className="text-sm">Gluten-Free</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={crust.is_vegan || false}
                        onCheckedChange={(checked) => updateCrust(index, 'is_vegan', checked)}
                      />
                      <label className="text-sm">Vegan</label>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          {/* SAUCES TAB */}
          <TabsContent value="sauces" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Pizza Sauces</h3>
              <Button onClick={addSauce} size="sm" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Sauce
              </Button>
            </div>
            
            <div className="grid gap-4">
              {config.sauces.map((sauce, index) => (
                <Card key={sauce.id} className="p-4 border-l-4 border-l-red-500">
                  <div className="grid grid-cols-6 gap-4 items-start">
                    <div>
                      <label className="text-sm font-medium">Name</label>
                      <Input
                        value={sauce.name}
                        onChange={(e) => updateSauce(index, 'name', e.target.value)}
                        placeholder="Classic Tomato"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm font-medium">Description</label>
                      <Input
                        value={sauce.description || ''}
                        onChange={(e) => updateSauce(index, 'description', e.target.value)}
                        placeholder="Traditional pizza sauce with herbs"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Price Modifier ($)</label>
                      <Input
                        type="number"
                        step="0.25"
                        value={sauce.price_modifier}
                        onChange={(e) => updateSauce(index, 'price_modifier', parseFloat(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={sauce.is_available}
                          onCheckedChange={(checked) => updateSauce(index, 'is_available', checked)}
                        />
                        <label className="text-sm">Available</label>
                      </div>
                      {sauce.is_vegan && (
                        <Badge className="bg-green-100 text-green-800 text-xs">Vegan</Badge>
                      )}
                      {sauce.is_spicy && (
                        <Badge className="bg-red-100 text-red-800 text-xs">🌶️ Spicy</Badge>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteSauce(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={sauce.is_vegan || false}
                        onCheckedChange={(checked) => updateSauce(index, 'is_vegan', checked)}
                      />
                      <label className="text-sm">Vegan</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={sauce.is_spicy || false}
                        onCheckedChange={(checked) => updateSauce(index, 'is_spicy', checked)}
                      />
                      <label className="text-sm">Spicy</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={sauce.is_dairy_free || false}
                        onCheckedChange={(checked) => updateSauce(index, 'is_dairy_free', checked)}
                      />
                      <label className="text-sm">Dairy-Free</label>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          {/* TOPPINGS TAB */}
          <TabsContent value="toppings" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Pizza Toppings</h3>
              <Button onClick={addTopping} size="sm" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Topping
              </Button>
            </div>

            {/* Filter by category */}
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge className="bg-red-100 text-red-800">
                Meats: {config.toppings.filter(t => t.category === 'meat').length}
              </Badge>
              <Badge className="bg-green-100 text-green-800">
                Vegetables: {config.toppings.filter(t => t.category === 'vegetable').length}
              </Badge>
              <Badge className="bg-yellow-100 text-yellow-800">
                Cheeses: {config.toppings.filter(t => t.category === 'cheese').length}
              </Badge>
            </div>
            
            <div className="grid gap-4">
              {config.toppings.map((topping, index) => (
                <Card key={topping.id} className={`p-4 border-l-4 ${
                  topping.category === 'meat' ? 'border-l-red-500' :
                  topping.category === 'vegetable' ? 'border-l-green-500' :
                  topping.category === 'cheese' ? 'border-l-yellow-500' : 'border-l-gray-500'
                }`}>
                  <div className="grid grid-cols-7 gap-4 items-start">
                    <div>
                      <label className="text-sm font-medium">Name</label>
                      <Input
                        value={topping.name}
                        onChange={(e) => updateTopping(index, 'name', e.target.value)}
                        placeholder="Pepperoni"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Category</label>
                      <Select 
                        value={topping.category} 
                        onValueChange={(value) => updateTopping(index, 'category', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="meat">Meat</SelectItem>
                          <SelectItem value="vegetable">Vegetable</SelectItem>
                          <SelectItem value="cheese">Cheese</SelectItem>
                          <SelectItem value="sauce">Sauce</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Price Modifier ($)</label>
                      <Input
                        type="number"
                        step="0.25"
                        value={topping.price_modifier}
                        onChange={(e) => updateTopping(index, 'price_modifier', parseFloat(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Allergens</label>
                      <Input
                        value={topping.allergens?.join(', ') || ''}
                        onChange={(e) => updateTopping(index, 'allergens', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                        placeholder="dairy, nuts"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={topping.is_available}
                          onCheckedChange={(checked) => updateTopping(index, 'is_available', checked)}
                        />
                        <label className="text-sm">Available</label>
                      </div>
                      {topping.is_premium && (
                        <Badge className="bg-purple-100 text-purple-800 text-xs">Premium</Badge>
                      )}
                    </div>
                    <div className="space-y-1">
                      {topping.is_vegetarian && (
                        <Badge className="bg-green-100 text-green-800 text-xs">Vegetarian</Badge>
                      )}
                      {topping.is_vegan && (
                        <Badge className="bg-green-100 text-green-800 text-xs">Vegan</Badge>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteTopping(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-3 flex gap-2 flex-wrap">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={topping.is_vegetarian || false}
                        onCheckedChange={(checked) => updateTopping(index, 'is_vegetarian', checked)}
                      />
                      <label className="text-sm">Vegetarian</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={topping.is_vegan || false}
                        onCheckedChange={(checked) => updateTopping(index, 'is_vegan', checked)}
                      />
                      <label className="text-sm">Vegan</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={topping.is_premium || false}
                        onCheckedChange={(checked) => updateTopping(index, 'is_premium', checked)}
                      />
                      <label className="text-sm">Premium</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={topping.is_organic || false}
                        onCheckedChange={(checked) => updateTopping(index, 'is_organic', checked)}
                      />
                      <label className="text-sm">Organic</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={topping.is_gluten_free || false}
                        onCheckedChange={(checked) => updateTopping(index, 'is_gluten_free', checked)}
                      />
                      <label className="text-sm">Gluten-Free</label>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Eye, EyeOff, DollarSign, Clock, Save, X } from 'lucide-react';

interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  cost: number;
  images: any[];
  options: any[];
  nutritional_info?: any;
  allergens: string[];
  tags: string[];
  availability: {
    is_available: boolean;
    available_days: number[];
    available_times: Array<{ start_time: string; end_time: string; }>;
    stock_quantity?: number;
    out_of_stock_message?: string;
  };
  display_order: number;
  is_active: boolean;
  is_featured: boolean;
  preparation_time: number;
  created_at: string;
  updated_at: string;
}

interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  display_order: number;
  is_active: boolean;
  items: MenuItem[];
}

interface RestaurantMenu {
  id: string;
  restaurantId: string;
  tenantId: string;
  name: string;
  description?: string;
  categories: MenuCategory[];
  is_active: boolean;
  display_order: number;
  created_at: Date;
  updated_at: Date;
  created_by: string;
}

interface MenuManagementProps {
  restaurantId: string;
}

export const MenuManagement: React.FC<MenuManagementProps> = ({ restaurantId }) => {
  const [menus, setMenus] = useState<RestaurantMenu[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<RestaurantMenu | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [showNewItemForm, setShowNewItemForm] = useState<string | null>(null);
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [showNewMenuForm, setShowNewMenuForm] = useState(false);

  const fetchMenus = async () => {
    setLoading(true);
    try {
      // Get menus from localStorage temporarily until auth is fixed
      const localMenus = JSON.parse(localStorage.getItem(`menus_${restaurantId}`) || '[]');
      console.log('Loading menus from localStorage:', localMenus);
      
      setMenus(localMenus);
      if (localMenus.length > 0 && !selectedMenu) {
        setSelectedMenu(localMenus[0]);
      }
      
      /* Original API call - commented out until auth is fixed
      const token = localStorage.getItem('jwt_token');
      const response = await fetch(`/api/v1/menu-management/restaurant/${restaurantId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'x-tenant-id': 'default-tenant'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMenus(data.data);
        if (data.data.length > 0 && !selectedMenu) {
          setSelectedMenu(data.data[0]);
        }
      } else {
        console.error('Failed to fetch menus');
      }
      */
    } catch (error) {
      console.error('Error fetching menus:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, [restaurantId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const toggleItemAvailability = async (item: MenuItem) => {
    try {
      if (!selectedMenu) return;

      const updatedMenu = {
        ...selectedMenu,
        categories: selectedMenu.categories.map(category => ({
          ...category,
          items: category.items.map(menuItem => 
            menuItem.id === item.id 
              ? {
                  ...menuItem,
                  availability: {
                    ...menuItem.availability,
                    is_available: !menuItem.availability.is_available
                  }
                }
              : menuItem
          )
        }))
      };

      // Update localStorage
      const existingMenus = JSON.parse(localStorage.getItem(`menus_${restaurantId}`) || '[]');
      const menuIndex = existingMenus.findIndex(m => m.id === selectedMenu.id);
      if (menuIndex !== -1) {
        existingMenus[menuIndex] = updatedMenu;
        localStorage.setItem(`menus_${restaurantId}`, JSON.stringify(existingMenus));
      }

      setSelectedMenu(updatedMenu);
      setMenus(existingMenus);
      
      const newStatus = !item.availability.is_available ? 'available' : 'unavailable';
      alert(`Menu item marked as ${newStatus}!`);
    } catch (error) {
      console.error('Error updating item availability:', error);
      alert(`Error updating availability: ${error.message}`);
    }
  };

  const saveMenuItem = async (categoryId: string, itemData: Partial<MenuItem>) => {
    try {
      if (!selectedMenu) return;

      if (editingItem) {
        // Update existing item
        const updatedMenu = {
          ...selectedMenu,
          categories: selectedMenu.categories.map(category => {
            if (category.id === categoryId) {
              return {
                ...category,
                items: category.items.map(item => 
                  item.id === editingItem.id 
                    ? { ...item, ...itemData, updated_at: new Date() }
                    : item
                )
              };
            }
            return category;
          })
        };

        // Update localStorage
        const existingMenus = JSON.parse(localStorage.getItem(`menus_${restaurantId}`) || '[]');
        const menuIndex = existingMenus.findIndex(m => m.id === selectedMenu.id);
        if (menuIndex !== -1) {
          existingMenus[menuIndex] = updatedMenu;
          localStorage.setItem(`menus_${restaurantId}`, JSON.stringify(existingMenus));
        }

        setSelectedMenu(updatedMenu);
        setMenus(existingMenus);
        setEditingItem(null);
        alert('Menu item updated successfully!');
      } else {
        // Create new item
        const newItem = {
          id: `item-${Date.now()}`,
          categoryId: categoryId,
          name: itemData.name || '',
          description: itemData.description || '',
          price: itemData.price || 0,
          cost: itemData.cost || 0,
          images: [],
          options: [],
          nutritional_info: {},
          allergens: itemData.allergens || [],
          tags: itemData.tags || [],
          availability: {
            is_available: true,
            available_days: [1, 2, 3, 4, 5, 6, 7],
            available_times: [{ start_time: '09:00', end_time: '22:00' }],
            stock_quantity: null,
            out_of_stock_message: ''
          },
          display_order: 1,
          is_active: itemData.is_active !== false,
          is_featured: itemData.is_featured || false,
          preparation_time: itemData.preparation_time || 15,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const updatedMenu = {
          ...selectedMenu,
          categories: selectedMenu.categories.map(category => {
            if (category.id === categoryId) {
              return {
                ...category,
                items: [...category.items, newItem]
              };
            }
            return category;
          })
        };

        // Update localStorage
        const existingMenus = JSON.parse(localStorage.getItem(`menus_${restaurantId}`) || '[]');
        const menuIndex = existingMenus.findIndex(m => m.id === selectedMenu.id);
        if (menuIndex !== -1) {
          existingMenus[menuIndex] = updatedMenu;
          localStorage.setItem(`menus_${restaurantId}`, JSON.stringify(existingMenus));
        }

        setSelectedMenu(updatedMenu);
        setMenus(existingMenus);
        setShowNewItemForm(null);
        alert('Menu item created successfully!');
      }
    } catch (error) {
      console.error('Error saving menu item:', error);
      alert(`Error saving menu item: ${error.message}`);
    }
  };

  const deleteMenuItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;

    try {
      if (!selectedMenu) return;

      const updatedMenu = {
        ...selectedMenu,
        categories: selectedMenu.categories.map(category => ({
          ...category,
          items: category.items.filter(item => item.id !== itemId)
        }))
      };

      // Update localStorage
      const existingMenus = JSON.parse(localStorage.getItem(`menus_${restaurantId}`) || '[]');
      const menuIndex = existingMenus.findIndex(m => m.id === selectedMenu.id);
      if (menuIndex !== -1) {
        existingMenus[menuIndex] = updatedMenu;
        localStorage.setItem(`menus_${restaurantId}`, JSON.stringify(existingMenus));
      }

      setSelectedMenu(updatedMenu);
      setMenus(existingMenus);
      alert('Menu item deleted successfully!');
    } catch (error) {
      console.error('Error deleting menu item:', error);
      alert(`Error deleting menu item: ${error.message}`);
    }
  };

  const createMenu = async (menuData: { name: string; description?: string }) => {
    try {
      // Get user data for tenant info
      const userData = localStorage.getItem('menuca_user');
      const user = userData ? JSON.parse(userData) : null;
      const tenantId = user?.tenant?.id || 'default-tenant';
      
      console.log('Creating menu with data:', menuData);
      console.log('Restaurant ID:', restaurantId);
      console.log('User:', user);
      
      // Create menu locally for now since auth system needs fixing
      // TODO: This should use proper JWT auth once that's implemented
      const mockMenu = {
        id: `menu-${Date.now()}`,
        restaurantId: restaurantId,
        tenantId: tenantId,
        name: menuData.name,
        description: menuData.description,
        categories: [],
        is_active: true,
        display_order: 1,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: user?.id || 'unknown'
      };
      
      // Store locally until backend is properly connected
      const existingMenus = JSON.parse(localStorage.getItem(`menus_${restaurantId}`) || '[]');
      existingMenus.push(mockMenu);
      localStorage.setItem(`menus_${restaurantId}`, JSON.stringify(existingMenus));
      
      setShowNewMenuForm(false);
      fetchMenus();
      alert('Menu created successfully! (Stored locally until backend auth is fixed)');
      
      return;
      
      /* Original API call - commented out until auth is fixed */
    } catch (error) {
      console.error('Error creating menu:', error);
      alert(`Error creating menu: ${error.message}`);
    }
  };

  const createCategory = async (categoryData: { name: string; description?: string }) => {
    try {
      if (!selectedMenu) return;

      const newCategory = {
        id: `category-${Date.now()}`,
        name: categoryData.name,
        description: categoryData.description,
        display_order: selectedMenu.categories.length + 1,
        is_active: true,
        items: []
      };

      // Update the selected menu with new category
      const updatedMenu = {
        ...selectedMenu,
        categories: [...selectedMenu.categories, newCategory]
      };

      // Update localStorage
      const existingMenus = JSON.parse(localStorage.getItem(`menus_${restaurantId}`) || '[]');
      const menuIndex = existingMenus.findIndex(m => m.id === selectedMenu.id);
      if (menuIndex !== -1) {
        existingMenus[menuIndex] = updatedMenu;
        localStorage.setItem(`menus_${restaurantId}`, JSON.stringify(existingMenus));
      }

      setSelectedMenu(updatedMenu);
      setMenus(existingMenus);
      setShowNewCategoryForm(false);
      
      alert('Category created successfully!');
    } catch (error) {
      console.error('Error creating category:', error);
      alert(`Error creating category: ${error.message}`);
    }
  };

  const MenuItemForm: React.FC<{ 
    categoryId: string; 
    item?: MenuItem; 
    onSave: (categoryId: string, data: Partial<MenuItem>) => void; 
    onCancel: () => void; 
  }> = ({ categoryId, item, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
      name: item?.name || '',
      description: item?.description || '',
      price: item?.price || 0,
      cost: item?.cost || 0,
      preparation_time: item?.preparation_time || 15,
      allergens: item?.allergens?.join(', ') || '',
      tags: item?.tags?.join(', ') || '',
      is_featured: item?.is_featured || false,
      is_active: item?.is_active !== false
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave(categoryId, {
        ...formData,
        allergens: formData.allergens.split(',').map(s => s.trim()).filter(Boolean),
        tags: formData.tags.split(',').map(s => s.trim()).filter(Boolean)
      });
    };

    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>{item ? 'Edit Menu Item' : 'Add New Menu Item'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Item Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Price</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Cost</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Prep Time (min)</label>
                <Input
                  type="number"
                  value={formData.preparation_time}
                  onChange={(e) => setFormData({ ...formData, preparation_time: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium">Options</label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_featured}
                      onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                      className="mr-2"
                    />
                    Featured
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="mr-2"
                    />
                    Active
                  </label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Allergens (comma-separated)</label>
                <Input
                  value={formData.allergens}
                  onChange={(e) => setFormData({ ...formData, allergens: e.target.value })}
                  placeholder="nuts, dairy, gluten"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Tags (comma-separated)</label>
                <Input
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="spicy, vegetarian, popular"
                />
              </div>
            </div>

            <div className="flex space-x-2">
              <Button type="submit" className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Save Item
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  };

  const MenuCreationForm: React.FC<{ 
    onSave: (data: { name: string; description?: string }) => void; 
    onCancel: () => void; 
  }> = ({ onSave, onCancel }) => {
    const [formData, setFormData] = useState({
      name: '',
      description: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave(formData);
    };

    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Create New Menu</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Menu Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Dinner Menu, Lunch Specials"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description (Optional)</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this menu"
              />
            </div>
            <div className="flex space-x-2">
              <Button type="submit" className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Create Menu
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  };

  const CategoryCreationForm: React.FC<{ 
    onSave: (data: { name: string; description?: string }) => void; 
    onCancel: () => void; 
  }> = ({ onSave, onCancel }) => {
    const [formData, setFormData] = useState({
      name: '',
      description: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave(formData);
    };

    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Create New Category</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Category Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Appetizers, Main Courses, Desserts"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description (Optional)</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this category"
              />
            </div>
            <div className="flex space-x-2">
              <Button type="submit" className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Create Category
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!selectedMenu) {
    return (
      <div className="p-6 space-y-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <p className="text-gray-500">No menus found. Create your first menu to get started.</p>
            <Button 
              className="mt-4" 
              onClick={() => setShowNewMenuForm(true)}
            >
              Create Menu
            </Button>
          </CardContent>
        </Card>
        
        {showNewMenuForm && (
          <MenuCreationForm
            onSave={createMenu}
            onCancel={() => setShowNewMenuForm(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Menu Selector */}
      {menus.length > 1 && (
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Currently managing:</label>
            <Select value={selectedMenu.id} onValueChange={(menuId) => {
              const menu = menus.find(m => m.id === menuId);
              if (menu) setSelectedMenu(menu);
            }}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {menus.map((menu) => (
                  <SelectItem key={menu.id} value={menu.id}>
                    {menu.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <div className="bg-white px-4 py-2 rounded-lg border">
        <nav className="flex text-sm text-gray-600">
          <span>Restaurant</span>
          <span className="mx-2">→</span>
          <span className="font-semibold text-blue-600">{selectedMenu.name}</span>
          <span className="mx-2">→</span>
          <span>Categories & Items</span>
        </nav>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {selectedMenu.name}
          </h1>
          <p className="text-gray-600 mt-1">
            {selectedMenu.description || 'Manage categories and menu items for this menu'}
          </p>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
            <span>📁 {selectedMenu.categories.length} categories</span>
            <span>🍽️ {selectedMenu.categories.reduce((total, cat) => total + cat.items.length, 0)} items</span>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button onClick={() => setShowNewCategoryForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Category
          </Button>
        </div>
      </div>

      {/* Category Creation Form */}
      {showNewCategoryForm && (
        <CategoryCreationForm
          onSave={createCategory}
          onCancel={() => setShowNewCategoryForm(false)}
        />
      )}

      {/* Menu Categories */}
      <div className="space-y-6">
        {selectedMenu.categories.map((category, index) => (
          <Card key={category.id} className="border-l-4 border-l-blue-500 shadow-sm">
            <CardHeader className="bg-gray-50">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                      Category {index + 1}
                    </div>
                    <CardTitle className="text-xl text-gray-900">{category.name}</CardTitle>
                  </div>
                  {category.description && (
                    <p className="text-gray-600 mt-2">{category.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span>🍽️ {category.items.length} items</span>
                    <span>✅ {category.items.filter(item => item.availability.is_available).length} available</span>
                    <span>❌ {category.items.filter(item => !item.availability.is_available).length} unavailable</span>
                  </div>
                </div>
                <Button
                  onClick={() => setShowNewItemForm(category.id)}
                  size="sm"
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  Add Menu Item
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              {category.items.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No items in this category</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {category.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-semibold">{item.name}</h3>
                          {item.is_featured && (
                            <Badge className="bg-yellow-100 text-yellow-800">Featured</Badge>
                          )}
                          {!item.availability.is_available && (
                            <Badge className="bg-red-100 text-red-800">Unavailable</Badge>
                          )}
                        </div>
                        
                        {item.description && (
                          <p className="text-gray-600 mt-1">{item.description}</p>
                        )}
                        
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-1" />
                            {formatCurrency(item.price)}
                          </span>
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {item.preparation_time} min
                          </span>
                          {item.allergens.length > 0 && (
                            <span>Allergens: {item.allergens.join(', ')}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleItemAvailability(item)}
                        >
                          {item.availability.is_available ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingItem(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteMenuItem(item.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* New Item Form */}
              {showNewItemForm === category.id && (
                <MenuItemForm
                  categoryId={category.id}
                  onSave={saveMenuItem}
                  onCancel={() => setShowNewItemForm(null)}
                />
              )}

              {/* Edit Item Form */}
              {editingItem && editingItem.categoryId === category.id && (
                <MenuItemForm
                  categoryId={category.id}
                  item={editingItem}
                  onSave={saveMenuItem}
                  onCancel={() => setEditingItem(null)}
                />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedMenu.categories.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <p className="text-gray-500">No categories found. Add your first category to get started.</p>
            <Button className="mt-4" onClick={() => setShowNewCategoryForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
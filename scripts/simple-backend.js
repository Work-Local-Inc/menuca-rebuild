/**
 * Simple Express backend to receive and serve scraped menu data
 * For testing the complete MenuCA workflow
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage (in production this would be a database)
let restaurants = new Map();
let menus = new Map();
let categories = new Map();
let items = new Map();

// Health check
app.get('/api/monitoring/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime()
  });
});

// Restaurant endpoints
app.post('/api/restaurants', (req, res) => {
  const restaurant = {
    id: `restaurant_${Date.now()}`,
    ...req.body,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  restaurants.set(restaurant.id, restaurant);
  console.log(`✅ Restaurant created: ${restaurant.name} (${restaurant.id})`);
  
  res.status(201).json(restaurant);
});

app.get('/api/restaurants/:id', (req, res) => {
  const restaurant = restaurants.get(req.params.id);
  if (!restaurant) {
    return res.status(404).json({ error: 'Restaurant not found' });
  }
  res.json(restaurant);
});

app.get('/api/restaurants', (req, res) => {
  res.json(Array.from(restaurants.values()));
});

// Menu endpoints
app.post('/api/menu-management/restaurant/:restaurantId/menus', (req, res) => {
  const menu = {
    id: `menu_${Date.now()}`,
    restaurantId: req.params.restaurantId,
    ...req.body,
    categories: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  menus.set(menu.id, menu);
  console.log(`✅ Menu created: ${menu.name} (${menu.id})`);
  
  res.status(201).json(menu);
});

app.get('/api/menu-management/restaurant/:restaurantId', (req, res) => {
  const restaurantMenus = Array.from(menus.values())
    .filter(menu => menu.restaurantId === req.params.restaurantId)
    .map(menu => ({
      ...menu,
      categories: Array.from(categories.values())
        .filter(cat => cat.menuId === menu.id)
        .map(cat => ({
          ...cat,
          items: Array.from(items.values()).filter(item => item.categoryId === cat.id)
        }))
    }));
  
  res.json(restaurantMenus);
});

// Category endpoints
app.post('/api/menu-management/menus/:menuId/categories', (req, res) => {
  const category = {
    id: `category_${Date.now()}`,
    menuId: req.params.menuId,
    ...req.body,
    items: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  categories.set(category.id, category);
  console.log(`✅ Category created: ${category.name} (${category.id})`);
  
  res.status(201).json(category);
});

// Item endpoints
app.post('/api/menu-management/categories/:categoryId/items', (req, res) => {
  const item = {
    id: `item_${Date.now()}`,
    categoryId: req.params.categoryId,
    ...req.body,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  items.set(item.id, item);
  console.log(`✅ Item created: ${item.name} ($${(item.price / 100).toFixed(2)}) (${item.id})`);
  
  res.status(201).json(item);
});

// Frontend-friendly menu endpoint
app.get('/api/restaurants/:restaurantId/menu', (req, res) => {
  const restaurant = restaurants.get(req.params.restaurantId);
  if (!restaurant) {
    return res.status(404).json({ error: 'Restaurant not found' });
  }

  const restaurantMenus = Array.from(menus.values())
    .filter(menu => menu.restaurantId === req.params.restaurantId)
    .map(menu => ({
      ...menu,
      categories: Array.from(categories.values())
        .filter(cat => cat.menuId === menu.id)
        .map(cat => ({
          ...cat,
          items: Array.from(items.values()).filter(item => item.categoryId === cat.id)
        }))
    }));

  res.json({
    restaurant,
    menus: restaurantMenus
  });
});

// Order endpoints (for Stripe testing)
app.post('/api/orders', (req, res) => {
  const order = {
    id: `order_${Date.now()}`,
    ...req.body,
    status: 'pending',
    total_amount: req.body.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  console.log(`🛒 Order created: ${order.id} ($${(order.total_amount / 100).toFixed(2)})`);
  
  res.status(201).json(order);
});

// Stripe payment endpoints
app.post('/api/payments/create-intent', (req, res) => {
  // Mock Stripe payment intent
  const paymentIntent = {
    id: `pi_${Date.now()}`,
    client_secret: `pi_${Date.now()}_secret`,
    amount: req.body.amount,
    currency: 'cad',
    status: 'requires_payment_method'
  };
  
  console.log(`💳 Payment intent created: ${paymentIntent.id} ($${(req.body.amount / 100).toFixed(2)})`);
  
  res.json(paymentIntent);
});

app.post('/api/payments/confirm', (req, res) => {
  console.log(`✅ Payment confirmed: ${req.body.payment_intent_id}`);
  
  res.json({
    status: 'succeeded',
    payment_intent: {
      id: req.body.payment_intent_id,
      status: 'succeeded'
    }
  });
});

// Bulk import endpoint (for our scraper)
app.post('/api/bulk-import/menu-data', async (req, res) => {
  try {
    console.log('📦 Starting bulk menu data import...');
    const { restaurant: restaurantData, categories: categoriesData } = req.body;
    
    // Create restaurant
    const restaurant = {
      id: `restaurant_${Date.now()}`,
      ...restaurantData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    restaurants.set(restaurant.id, restaurant);
    
    // Create main menu
    const menu = {
      id: `menu_${Date.now()}`,
      restaurantId: restaurant.id,
      name: 'Main Menu',
      description: 'Complete menu',
      is_active: true,
      categories: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    menus.set(menu.id, menu);
    
    let totalItems = 0;
    
    // Create categories and items
    for (const categoryData of categoriesData) {
      const category = {
        id: `category_${Date.now()}_${Math.random()}`,
        menuId: menu.id,
        name: categoryData.name,
        description: categoryData.description || '',
        display_order: categories.size + 1,
        is_active: true,
        items: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      categories.set(category.id, category);
      
      for (const itemData of categoryData.items) {
        const item = {
          id: `item_${Date.now()}_${Math.random()}`,
          categoryId: category.id,
          name: itemData.name,
          description: itemData.description || '',
          price: itemData.variants[0]?.price || 0,
          variants: itemData.variants || [],
          tags: itemData.tags || [],
          dietary: itemData.dietary || [],
          preparationTime: itemData.preparationTime || 15,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        items.set(item.id, item);
        totalItems++;
      }
    }
    
    console.log(`✅ Bulk import completed: ${categoriesData.length} categories, ${totalItems} items`);
    
    res.json({
      success: true,
      restaurant,
      menu,
      stats: {
        categories: categoriesData.length,
        items: totalItems
      }
    });
    
  } catch (error) {
    console.error('❌ Bulk import failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// Error handler
app.use((error, req, res, next) => {
  console.error('❌ Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 MenuCA Test Backend running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/monitoring/health`);
  console.log(`🏪 Ready to receive menu data!`);
});

module.exports = app;
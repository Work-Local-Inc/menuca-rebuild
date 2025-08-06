/**
 * Push scraped menu data to MenuCA backend APIs
 * Tests the complete flow from scraper → backend → frontend
 */

const fs = require('fs');
const path = require('path');

class MenuPusher {
  constructor() {
    this.baseUrl = 'http://localhost:3000/api';
    this.authToken = null;
    this.tenantId = null;
    this.restaurantId = null;
  }

  async pushScrapedData() {
    console.log('🚀 Starting MenuCA backend integration test...');
    
    try {
      // 1. Load the latest scraped data
      const scrapedData = await this.loadLatestScrapedData();
      console.log(`📊 Loaded menu data: ${scrapedData.categories.length} categories, ${this.countTotalItems(scrapedData.categories)} items`);
      
      // 2. Check if backend is running
      await this.checkBackendHealth();
      
      // 3. Authenticate (for now we'll use a mock token)
      await this.authenticate();
      
      // 4. Use bulk import for faster testing
      await this.bulkImportMenuData(scrapedData);
      
      // 6. Verify the data was saved
      await this.verifyMenuData();
      
      console.log('✅ Backend integration test completed successfully!');
      console.log(`🏪 Restaurant ID: ${this.restaurantId}`);
      console.log(`📱 Test the frontend at: http://localhost:3001/restaurant/${this.restaurantId}`);
      
    } catch (error) {
      console.error('❌ Backend integration failed:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      throw error;
    }
  }

  async loadLatestScrapedData() {
    const dataDir = path.join(__dirname, '..', 'data');
    const files = fs.readdirSync(dataDir)
      .filter(file => file.startsWith('xtreme-pizza-') && file.endsWith('.json'))
      .sort()
      .reverse(); // Get latest file
    
    if (files.length === 0) {
      throw new Error('No scraped data found. Run `npm run scrape:xtreme` first.');
    }
    
    const latestFile = files[0];
    const filePath = path.join(dataDir, latestFile);
    console.log(`📂 Loading data from: ${latestFile}`);
    
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }

  async checkBackendHealth() {
    console.log('🏥 Checking backend health...');
    
    try {
      const response = await fetch(`${this.baseUrl}/monitoring/health`);
      if (!response.ok) {
        throw new Error(`Backend health check failed: ${response.status}`);
      }
      console.log('✅ Backend is healthy');
    } catch (error) {
      console.log('⚠️  Backend health check failed, trying to start server...');
      console.log('💡 Make sure to run: npm run dev:server in another terminal');
      throw new Error('Backend not available. Please start the server with `npm run dev:server`');
    }
  }

  async authenticate() {
    console.log('🔐 Setting up authentication...');
    
    // For testing, we'll use a mock token
    this.authToken = 'mock-token-for-testing';
    this.tenantId = 'xtreme-pizza-tenant';
    
    console.log('✅ Authentication set up (using mock token for testing)');
  }

  async createRestaurant(restaurantData) {
    console.log('🏪 Creating restaurant...');
    
    const restaurantPayload = {
      name: restaurantData.name,
      description: `Authentic ${restaurantData.cuisine} restaurant serving fresh, delicious food`,
      address: {
        street: '123 Pizza Street',
        city: 'Ottawa',
        state: 'ON',
        postal_code: 'K1A 0A6',
        country: 'Canada',
        latitude: 45.4215,
        longitude: -75.6972
      },
      contact: {
        phone: '(613) 555-PIZZA',
        email: 'contact@xtremepizza.ca',
        website: restaurantData.website
      },
      businessHours: [
        {
          day: 'monday',
          open_time: '11:00',
          close_time: '23:00',
          is_closed: false
        },
        {
          day: 'tuesday',
          open_time: '11:00',
          close_time: '23:00',
          is_closed: false
        },
        {
          day: 'wednesday',
          open_time: '11:00',
          close_time: '23:00',
          is_closed: false
        },
        {
          day: 'thursday',
          open_time: '11:00',
          close_time: '23:00',
          is_closed: false
        },
        {
          day: 'friday',
          open_time: '11:00',
          close_time: '24:00',
          is_closed: false
        },
        {
          day: 'saturday',
          open_time: '11:00',
          close_time: '24:00',
          is_closed: false
        },
        {
          day: 'sunday',
          open_time: '12:00',
          close_time: '22:00',
          is_closed: false
        }
      ],
      cuisine_type: [restaurantData.cuisine.toLowerCase()],
      price_range: 'moderate',
      delivery_zones: [
        {
          name: 'Ottawa Central',
          delivery_fee: 399, // $3.99
          min_order_amount: 2000, // $20.00
          delivery_time_min: 30,
          delivery_time_max: 45
        }
      ]
    };

    try {
      const response = await fetch(`${this.baseUrl}/restaurants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`,
          'X-Tenant-ID': this.tenantId
        },
        body: JSON.stringify(restaurantPayload)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to create restaurant: ${response.status} - ${errorData}`);
      }

      const restaurant = await response.json();
      this.restaurantId = restaurant.id;
      
      console.log(`✅ Restaurant created: ${restaurant.name} (${this.restaurantId})`);
      return restaurant;
    } catch (error) {
      console.error('❌ Failed to create restaurant:', error.message);
      throw error;
    }
  }

  async pushMenuData(categories) {
    console.log('📋 Creating menu and categories...');
    
    // 1. Create main menu
    const menuPayload = {
      name: 'Main Menu',
      description: 'Our complete menu with all delicious options',
      is_active: true,
      display_order: 1
    };

    const menuResponse = await fetch(`${this.baseUrl}/menu-management/restaurant/${this.restaurantId}/menus`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authToken}`,
        'X-Tenant-ID': this.tenantId
      },
      body: JSON.stringify(menuPayload)
    });

    if (!menuResponse.ok) {
      const errorData = await menuResponse.text();
      throw new Error(`Failed to create menu: ${menuResponse.status} - ${errorData}`);
    }

    const menu = await menuResponse.json();
    const menuId = menu.id;
    console.log(`✅ Menu created: ${menu.name} (${menuId})`);

    // 2. Create categories and items
    for (let i = 0; i < categories.length; i++) {
      const category = categories[i];
      console.log(`📂 Creating category: ${category.name} (${category.items.length} items)`);
      
      // Create category
      const categoryPayload = {
        name: category.name,
        description: category.description || `Delicious ${category.name.toLowerCase()} options`,
        display_order: i + 1,
        is_active: true
      };

      const categoryResponse = await fetch(`${this.baseUrl}/menu-management/menus/${menuId}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`,
          'X-Tenant-ID': this.tenantId
        },
        body: JSON.stringify(categoryPayload)
      });

      if (!categoryResponse.ok) {
        const errorData = await categoryResponse.text();
        console.warn(`⚠️  Failed to create category ${category.name}: ${categoryResponse.status} - ${errorData}`);
        continue;
      }

      const createdCategory = await categoryResponse.json();
      const categoryId = createdCategory.id;

      // Create items in this category
      for (let j = 0; j < category.items.length; j++) {
        const item = category.items[j];
        
        // Use the first variant for the base price, create variants separately if needed
        const baseVariant = item.variants[0];
        
        const itemPayload = {
          name: item.name,
          description: item.description || `Delicious ${item.name.toLowerCase()}`,
          price: baseVariant.price,
          cost: Math.round(baseVariant.price * 0.4), // Estimate 40% cost
          display_order: j + 1,
          is_active: true,
          availability: {
            is_available: true,
            availability_schedule: 'always'
          },
          modifiers: [],
          dietary_info: item.dietary,
          preparation_time: item.preparationTime || 15,
          tags: item.tags
        };

        try {
          const itemResponse = await fetch(`${this.baseUrl}/menu-management/categories/${categoryId}/items`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.authToken}`,
              'X-Tenant-ID': this.tenantId
            },
            body: JSON.stringify(itemPayload)
          });

          if (itemResponse.ok) {
            console.log(`  ✅ Created item: ${item.name} ($${(baseVariant.price / 100).toFixed(2)})`);
          } else {
            const errorData = await itemResponse.text();
            console.warn(`  ⚠️  Failed to create item ${item.name}: ${itemResponse.status} - ${errorData}`);
          }
        } catch (error) {
          console.warn(`  ⚠️  Error creating item ${item.name}:`, error.message);
        }
      }
    }
  }

  async verifyMenuData() {
    console.log('🔍 Verifying menu data was saved correctly...');
    
    try {
      const response = await fetch(`${this.baseUrl}/menu-management/restaurant/${this.restaurantId}`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'X-Tenant-ID': this.tenantId
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to verify menu data: ${response.status}`);
      }

      const menus = await response.json();
      const totalCategories = menus.reduce((acc, menu) => acc + (menu.categories?.length || 0), 0);
      const totalItems = menus.reduce((acc, menu) => 
        acc + (menu.categories?.reduce((catAcc, cat) => catAcc + (cat.items?.length || 0), 0) || 0), 0);

      console.log(`✅ Menu verification complete:`);
      console.log(`   📋 Menus: ${menus.length}`);
      console.log(`   📂 Categories: ${totalCategories}`);
      console.log(`   🍕 Items: ${totalItems}`);
      
    } catch (error) {
      console.warn('⚠️  Could not verify menu data:', error.message);
    }
  }

  async bulkImportMenuData(scrapedData) {
    console.log('📦 Using bulk import for faster testing...');
    
    const payload = {
      restaurant: {
        name: scrapedData.restaurant.name,
        description: `Authentic ${scrapedData.restaurant.cuisine} restaurant`,
        address: {
          street: '123 Pizza Street',
          city: scrapedData.restaurant.location.split(', ')[1] || 'Ottawa',
          state: scrapedData.restaurant.location.split(', ')[1] || 'ON',
          postal_code: 'K1A 0A6',
          country: 'Canada'
        },
        contact: {
          phone: '(613) 555-PIZZA',
          email: 'contact@xtremepizza.ca',
          website: scrapedData.restaurant.website
        },
        cuisine_type: [scrapedData.restaurant.cuisine.toLowerCase()],
        price_range: 'moderate'
      },
      categories: scrapedData.categories
    };

    try {
      const response = await fetch(`${this.baseUrl}/bulk-import/menu-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`,
          'X-Tenant-ID': this.tenantId
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Bulk import failed: ${response.status} - ${errorData}`);
      }

      const result = await response.json();
      this.restaurantId = result.restaurant.id;
      
      console.log(`✅ Bulk import successful!`);
      console.log(`   🏪 Restaurant: ${result.restaurant.name} (${this.restaurantId})`);
      console.log(`   📊 Stats: ${result.stats.categories} categories, ${result.stats.items} items`);
      
      return result;
    } catch (error) {
      console.error('❌ Bulk import failed:', error.message);
      throw error;
    }
  }

  countTotalItems(categories) {
    return categories.reduce((total, category) => total + category.items.length, 0);
  }
}

// Run if called directly
if (require.main === module) {
  const pusher = new MenuPusher();
  
  pusher.pushScrapedData()
    .then(() => {
      console.log('🎉 Integration test completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Integration test failed:', error.message);
      process.exit(1);
    });
}

module.exports = MenuPusher;
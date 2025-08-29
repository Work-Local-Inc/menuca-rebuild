// Hardcoded menu data for known restaurants
// This is a temporary solution until we get proper scraping working

export const KNOWN_MENUS = {
  'ottawa.xtremepizzaottawa.com': {
    restaurant: {
      name: 'Xtreme Pizza Ottawa',
      cuisine: 'Pizza',
      location: 'Ottawa, ON'
    },
    categories: [
      {
        name: 'Appetizers',
        items: [
          { name: 'Xtreme Platter', description: 'Zucchini, chicken fingers, onion rings, fries, breaded shrimps', prices: [{ size: 'Regular', price: 19.99 }] },
          { name: 'Cheese Sticks', description: '8 pieces of mozzarella cheese sticks', prices: [{ size: '8 Pcs', price: 12.99 }] },
          { name: 'Jalapeno Slammers', description: '6 pieces stuffed with cream cheese', prices: [{ size: '6 Pcs', price: 13.99 }] },
          { name: 'Garlic Bread', description: 'Fresh baked bread with garlic butter', prices: [
            { size: 'Regular', price: 6.99 },
            { size: 'With Cheese', price: 7.99 },
            { size: 'With Cheese and Bacon', price: 8.99 }
          ]},
          { name: 'Nachos', description: 'Tortilla chips with cheese, green peppers, onions, olives', prices: [{ size: 'Regular', price: 16.99 }] },
          { name: 'Fries', description: 'Fresh cut french fries', prices: [
            { size: 'Small', price: 6.99 },
            { size: 'Large', price: 8.99 }
          ]},
          { name: 'Onion Rings', description: 'Beer battered onion rings', prices: [{ size: 'Regular', price: 8.99 }] },
          { name: 'Chicken Fingers', description: '5 pieces with plum sauce', prices: [{ size: '5 Pcs', price: 11.99 }] },
          { name: 'Deep Fried Pickles', description: 'Breaded dill pickles', prices: [{ size: 'Regular', price: 9.99 }] }
        ]
      },
      {
        name: 'Pizza',
        items: [
          { name: 'Plain Pizza', description: 'Tomato sauce and mozzarella cheese', prices: [
            { size: 'Small', price: 13.99 },
            { size: 'Medium', price: 19.99 },
            { size: 'Large', price: 25.99 },
            { size: 'X-Large', price: 31.99 }
          ]},
          { name: 'Pepperoni', description: 'Pepperoni and mozzarella cheese', prices: [
            { size: 'Small', price: 14.99 },
            { size: 'Medium', price: 21.99 },
            { size: 'Large', price: 28.99 },
            { size: 'X-Large', price: 35.99 }
          ]},
          { name: 'Hawaiian', description: 'Ham, pineapple, mozzarella cheese', prices: [
            { size: 'Small', price: 15.99 },
            { size: 'Medium', price: 22.99 },
            { size: 'Large', price: 29.99 },
            { size: 'X-Large', price: 36.99 }
          ]},
          { name: 'Canadian', description: 'Pepperoni, mushrooms, bacon strips', prices: [
            { size: 'Small', price: 16.99 },
            { size: 'Medium', price: 24.49 },
            { size: 'Large', price: 31.99 },
            { size: 'X-Large', price: 39.49 }
          ]},
          { name: 'Vegetarian', description: 'Mushrooms, green peppers, onions, tomatoes, green olives', prices: [
            { size: 'Small', price: 16.99 },
            { size: 'Medium', price: 24.49 },
            { size: 'Large', price: 31.99 },
            { size: 'X-Large', price: 39.49 }
          ]},
          { name: 'Meat Lovers', description: 'Pepperoni, ham, sausage, bacon strips, ground beef', prices: [
            { size: 'Small', price: 17.99 },
            { size: 'Medium', price: 25.99 },
            { size: 'Large', price: 33.99 },
            { size: 'X-Large', price: 41.99 }
          ]},
          { name: 'House Special', description: 'Pepperoni, mushrooms, green peppers, onions, bacon', prices: [
            { size: 'Small', price: 18.99 },
            { size: 'Medium', price: 27.49 },
            { size: 'Large', price: 35.99 },
            { size: 'X-Large', price: 43.49 }
          ]},
          { name: 'BBQ Chicken', description: 'BBQ sauce, chicken, red onions, bacon', prices: [
            { size: 'Small', price: 17.99 },
            { size: 'Medium', price: 25.99 },
            { size: 'Large', price: 33.99 },
            { size: 'X-Large', price: 41.99 }
          ]},
          { name: 'Greek Pizza', description: 'Feta cheese, olives, tomatoes, onions, green peppers', prices: [
            { size: 'Small', price: 16.99 },
            { size: 'Medium', price: 24.49 },
            { size: 'Large', price: 31.99 },
            { size: 'X-Large', price: 39.49 }
          ]}
        ]
      },
      {
        name: 'Wings',
        items: [
          { name: 'Chicken Wings', description: 'Choice of hot, mild, BBQ, honey garlic, or plain', prices: [
            { size: '10 Pcs', price: 14.99 },
            { size: '20 Pcs', price: 27.99 },
            { size: '30 Pcs', price: 39.99 },
            { size: '50 Pcs', price: 64.99 }
          ]},
          { name: 'Boneless Wings', description: 'Breaded chicken bites with choice of sauce', prices: [
            { size: '10 Pcs', price: 13.99 },
            { size: '20 Pcs', price: 25.99 },
            { size: '30 Pcs', price: 37.99 }
          ]}
        ]
      },
      {
        name: 'Poutine',
        items: [
          { name: 'Regular Poutine', description: 'Fresh fries, gravy, cheese curds', prices: [
            { size: 'Small', price: 8.99 },
            { size: 'Large', price: 11.99 }
          ]},
          { name: 'Bacon Poutine', description: 'Poutine topped with crispy bacon', prices: [
            { size: 'Small', price: 10.99 },
            { size: 'Large', price: 13.99 }
          ]},
          { name: 'Chicken Poutine', description: 'Poutine topped with grilled chicken', prices: [
            { size: 'Small', price: 12.99 },
            { size: 'Large', price: 15.99 }
          ]},
          { name: 'Meat Lovers Poutine', description: 'Bacon, sausage, pepperoni on poutine', prices: [
            { size: 'Small', price: 13.99 },
            { size: 'Large', price: 16.99 }
          ]}
        ]
      },
      {
        name: 'Pasta',
        items: [
          { name: 'Spaghetti Bolognese', description: 'Traditional meat sauce', prices: [{ size: 'Regular', price: 14.99 }] },
          { name: 'Chicken Alfredo', description: 'Creamy alfredo with grilled chicken', prices: [{ size: 'Regular', price: 16.99 }] },
          { name: 'Lasagna', description: 'Layers of pasta, meat sauce, cheese', prices: [{ size: 'Regular', price: 15.99 }] },
          { name: 'Penne Arrabiata', description: 'Spicy tomato sauce', prices: [{ size: 'Regular', price: 13.99 }] }
        ]
      },
      {
        name: 'Subs & Sandwiches',
        items: [
          { name: 'Chicken Sub', description: 'Grilled chicken, lettuce, tomatoes, mayo', prices: [
            { size: '6 inch', price: 8.99 },
            { size: '12 inch', price: 13.99 }
          ]},
          { name: 'Steak Sub', description: 'Philly steak, onions, mushrooms, cheese', prices: [
            { size: '6 inch', price: 9.99 },
            { size: '12 inch', price: 14.99 }
          ]},
          { name: 'Meatball Sub', description: 'Meatballs in marinara sauce with cheese', prices: [
            { size: '6 inch', price: 8.99 },
            { size: '12 inch', price: 13.99 }
          ]},
          { name: 'Club Sandwich', description: 'Turkey, bacon, lettuce, tomato', prices: [{ size: 'Regular', price: 11.99 }] }
        ]
      },
      {
        name: 'Salads',
        items: [
          { name: 'Caesar Salad', description: 'Romaine, croutons, parmesan, caesar dressing', prices: [
            { size: 'Small', price: 7.99 },
            { size: 'Large', price: 10.99 }
          ]},
          { name: 'Greek Salad', description: 'Lettuce, tomatoes, olives, feta, onions', prices: [
            { size: 'Small', price: 8.99 },
            { size: 'Large', price: 11.99 }
          ]},
          { name: 'Garden Salad', description: 'Mixed greens with fresh vegetables', prices: [
            { size: 'Small', price: 6.99 },
            { size: 'Large', price: 9.99 }
          ]}
        ]
      },
      {
        name: 'Beverages',
        items: [
          { name: 'Soft Drinks', description: 'Coke, Pepsi, Sprite, Orange, Ginger Ale', prices: [
            { size: 'Can', price: 1.99 },
            { size: '591ml', price: 2.99 },
            { size: '2L', price: 4.99 }
          ]},
          { name: 'Juice', description: 'Orange, Apple', prices: [{ size: '450ml', price: 2.99 }] },
          { name: 'Water', description: 'Bottled water', prices: [{ size: '500ml', price: 1.99 }] }
        ]
      },
      {
        name: 'Desserts',
        items: [
          { name: 'Chocolate Cake', description: 'Rich chocolate cake slice', prices: [{ size: 'Slice', price: 5.99 }] },
          { name: 'Cheesecake', description: 'New York style cheesecake', prices: [{ size: 'Slice', price: 6.99 }] },
          { name: 'Ice Cream', description: 'Vanilla, Chocolate, Strawberry', prices: [{ size: 'Cup', price: 3.99 }] }
        ]
      }
    ]
  }
};

export function getHardcodedMenu(url: string) {
  // Extract domain from URL
  const urlObj = new URL(url);
  const domain = urlObj.hostname;
  
  return KNOWN_MENUS[domain] || null;
}

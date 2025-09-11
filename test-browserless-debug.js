// Test script for Browserless debugger
// Paste this into their debugger at https://browserless.io

export default async ({ page }) => {
  // Navigate to Tony's Pizza menu
  await page.goto('https://order.tonys-pizza.ca/?p=menu', { 
    waitUntil: 'networkidle' 
  });
  
  // Wait for menu items to load
  await page.waitForSelector('.alternate_1, .alternate_2', { timeout: 10000 });
  
  // Find all menu items
  const menuItems = await page.$$('.alternate_1, .alternate_2');
  console.log(`Found ${menuItems.length} menu items`);
  
  // Try clicking on the first pizza item
  if (menuItems.length > 0) {
    const firstItem = menuItems[0];
    const itemText = await firstItem.textContent();
    console.log('Clicking on:', itemText);
    
    // Find and click the "Order this item" link
    const orderLink = await firstItem.$('a[href="#"]');
    if (orderLink) {
      await orderLink.click();
      
      // Wait for modal to appear
      await page.waitForTimeout(2000);
      
      // Check if a modal appeared
      const modal = await page.$('.fancybox-wrap, .modal, [role="dialog"]');
      if (modal) {
        console.log('Modal opened successfully!');
        
        // Try to find modifier groups
        const modifierGroups = await page.$$('fieldset, .options_wrapper, .group');
        console.log(`Found ${modifierGroups.length} modifier groups`);
        
        // Take a screenshot
        await page.screenshot({ fullPage: false });
        
        return {
          success: true,
          itemClicked: itemText,
          modalFound: true,
          modifierGroups: modifierGroups.length
        };
      }
    }
  }
  
  return {
    success: false,
    message: 'Could not open item modal'
  };
};

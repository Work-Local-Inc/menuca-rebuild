// Direct API scraper - bypass the UI and get the data directly

export async function scrapeMenuDirectly(url: string) {
  console.log('🎯 Attempting direct API scrape...');
  
  // The site uses a specific pattern for loading menu data
  // Based on the URL structure, let's try to find the menu data endpoint
  
  // Extract restaurant ID from URL
  const urlMatch = url.match(/https?:\/\/([^.]+)\./);
  const subdomain = urlMatch ? urlMatch[1] : 'ottawa';
  
  // These sites often use a standard menu loading pattern
  const possibleEndpoints = [
    `https://${subdomain}.xtremepizzaottawa.com/index.php?p=menu&action=getMenu`,
    `https://${subdomain}.xtremepizzaottawa.com/menu/load`,
    `https://${subdomain}.xtremepizzaottawa.com/?p=menu&format=json`,
    `https://${subdomain}.xtremepizzaottawa.com/includes/menu_data.php`,
  ];
  
  for (const endpoint of possibleEndpoints) {
    try {
      console.log(`Trying: ${endpoint}`);
      const response = await fetch(endpoint, {
        headers: {
          'Accept': 'application/json, text/javascript, */*',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      
      if (response.ok) {
        const text = await response.text();
        console.log(`Response preview: ${text.substring(0, 200)}`);
        
        // Try to parse as JSON
        try {
          const data = JSON.parse(text);
          return { success: true, data };
        } catch {
          // Not JSON, might be HTML with embedded data
          return { success: false, html: text };
        }
      }
    } catch (error) {
      console.log(`Failed: ${error.message}`);
    }
  }
  
  // If no direct API, let's try a different approach
  // Many of these sites load menu data via AJAX after page load
  console.log('🔍 Checking for AJAX menu loading...');
  
  // Get the main page
  const mainResponse = await fetch(url);
  const html = await mainResponse.text();
  
  // Look for menu data in script tags
  const scriptMatches = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi) || [];
  
  for (const script of scriptMatches) {
    // Look for menu data patterns
    if (script.includes('menuItems') || script.includes('products') || script.includes('categories')) {
      // Extract JSON-like structures
      const jsonMatch = script.match(/(\{[^{}]*\{[^{}]*\}[^{}]*\})/);
      if (jsonMatch) {
        try {
          const data = JSON.parse(jsonMatch[1]);
          return { success: true, data, source: 'embedded' };
        } catch {
          // Not valid JSON
        }
      }
    }
  }
  
  return { success: false, message: 'No direct API found' };
}

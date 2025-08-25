const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('🔍 Testing: https://menuca-rebuild-md50mozuv-lapptastiks-projects.vercel.app');
  await page.goto('https://menuca-rebuild-md50mozuv-lapptastiks-projects.vercel.app');
  
  // Take a screenshot
  await page.screenshot({ path: 'frontend-screenshot.png', fullPage: true });
  
  // Check what CSS is actually applied
  const cssFiles = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
    return links.map(link => link.href);
  });
  
  console.log('📄 CSS Files loaded:', cssFiles);
  
  // Check computed styles of main container
  const mainStyles = await page.evaluate(() => {
    const main = document.querySelector('div');
    if (!main) return null;
    const computed = window.getComputedStyle(main);
    return {
      background: computed.background,
      backgroundColor: computed.backgroundColor,
      backgroundImage: computed.backgroundImage,
      minHeight: computed.minHeight,
      display: computed.display
    };
  });
  
  console.log('🎨 Main container computed styles:', mainStyles);
  
  // Check if Tailwind classes are working
  const hasWorkingTailwind = await page.evaluate(() => {
    const testDiv = document.createElement('div');
    testDiv.className = 'bg-red-500 text-white p-4';
    document.body.appendChild(testDiv);
    const computed = window.getComputedStyle(testDiv);
    const hasRedBg = computed.backgroundColor === 'rgb(239, 68, 68)';
    document.body.removeChild(testDiv);
    return hasRedBg;
  });
  
  console.log('✅ Tailwind working:', hasWorkingTailwind);
  
  await browser.close();
  
  if (hasWorkingTailwind) {
    console.log('🎉 SOLUTION: Tailwind is working! The issue might be visual or browser-specific.');
  } else {
    console.log('❌ PROBLEM CONFIRMED: Tailwind utility classes are not being applied.');
  }
})();

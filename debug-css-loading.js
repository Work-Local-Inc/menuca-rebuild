const { chromium } = require('playwright');

async function debugCSSLoading() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Capture all network requests
  const requests = [];
  const responses = [];
  
  page.on('request', request => {
    if (request.url().includes('.css') || request.url().includes('styles') || request.url().includes('tailwind')) {
      requests.push({
        url: request.url(),
        method: request.method(),
        resourceType: request.resourceType()
      });
      console.log('📤 CSS REQUEST:', request.url());
    }
  });

  page.on('response', response => {
    if (response.url().includes('.css') || response.url().includes('styles') || response.url().includes('tailwind')) {
      responses.push({
        url: response.url(),
        status: response.status(),
        contentType: response.headers()['content-type']
      });
      console.log('📥 CSS RESPONSE:', response.status(), response.url());
    }
  });

  try {
    console.log('🔍 Loading page and inspecting CSS...');
    await page.goto('https://menuca-rebuild.vercel.app/restaurant/onboard', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Check if Tailwind classes are in the DOM
    const hasClasses = await page.evaluate(() => {
      const elements = document.querySelectorAll('[class*="bg-"], [class*="text-"], [class*="p-"], [class*="m-"], [class*="flex"], [class*="grid"]');
      return {
        elementsWithClasses: elements.length,
        sampleClasses: Array.from(elements).slice(0, 5).map(el => el.className)
      };
    });

    console.log('🎨 DOM Analysis:', hasClasses);

    // Check computed styles
    const computedStyles = await page.evaluate(() => {
      const button = document.querySelector('button');
      if (button) {
        const styles = window.getComputedStyle(button);
        return {
          backgroundColor: styles.backgroundColor,
          color: styles.color,
          padding: styles.padding,
          borderRadius: styles.borderRadius,
          classes: button.className
        };
      }
      return null;
    });

    console.log('🔧 Button Computed Styles:', computedStyles);

    // Check if any stylesheets are loaded
    const stylesheets = await page.evaluate(() => {
      return Array.from(document.styleSheets).map(sheet => {
        try {
          return {
            href: sheet.href,
            rules: sheet.cssRules ? sheet.cssRules.length : 'Access denied',
            disabled: sheet.disabled
          };
        } catch (e) {
          return {
            href: sheet.href,
            error: e.message
          };
        }
      });
    });

    console.log('📋 Loaded Stylesheets:', stylesheets);

    // Get the actual CSS content from the first stylesheet
    if (responses.length > 0) {
      console.log('\n📄 Fetching CSS content...');
      const cssResponse = await page.goto(responses[0].url);
      const cssContent = await cssResponse.text();
      console.log('📝 CSS Content Preview (first 500 chars):');
      console.log(cssContent.substring(0, 500));
      console.log('\n🔍 Looking for Tailwind utilities...');
      const hasTailwindUtils = cssContent.includes('.bg-') || cssContent.includes('.text-') || cssContent.includes('.p-') || cssContent.includes('.m-');
      console.log('Has Tailwind utilities:', hasTailwindUtils);
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }

  await browser.close();
}

debugCSSLoading();

/**
 * 🔍 ANALYZE NETWORK FILES FOR API CALLS
 * 
 * Since the order submission isn't showing as a separate API call,
 * it might be happening inside one of the JS files
 */
console.log('🔍 ANALYZING LOADED SCRIPTS FOR API CALLS');
console.log('==========================================');

// Function to search through all loaded scripts for API calls
function findApiCalls() {
    console.log('📜 Searching loaded scripts for API endpoints...');
    
    // Get all script elements
    const scripts = document.querySelectorAll('script');
    const apiPatterns = [
        /fetch\s*\(\s*['"`]([^'"`]+)['"`]/g,
        /\$\.ajax\s*\(\s*['"`]([^'"`]+)['"`]/g,
        /\$\.post\s*\(\s*['"`]([^'"`]+)['"`]/g,
        /XMLHttpRequest.*open\s*\(\s*['"`]\w+['"`]\s*,\s*['"`]([^'"`]+)['"`]/g,
        /axios\.[get|post|put|delete]+\s*\(\s*['"`]([^'"`]+)['"`]/g,
        /api\/[a-zA-Z0-9\-\/]+/g,
        /\/[a-zA-Z0-9\-]+\.php/g,
        /\/action/g,
        /\/submit/g,
        /\/order/g,
        /\/checkout/g
    ];
    
    const foundApis = new Set();
    
    scripts.forEach((script, index) => {
        if (script.src) {
            console.log(`📄 External script ${index + 1}: ${script.src}`);
        } else if (script.textContent) {
            console.log(`📄 Inline script ${index + 1}: ${script.textContent.substring(0, 100)}...`);
            
            // Search for API patterns in script content
            apiPatterns.forEach(pattern => {
                const matches = script.textContent.match(pattern);
                if (matches) {
                    matches.forEach(match => foundApis.add(match));
                }
            });
        }
    });
    
    if (foundApis.size > 0) {
        console.log('🎯 FOUND POTENTIAL API ENDPOINTS:');
        foundApis.forEach(api => console.log(`  - ${api}`));
    } else {
        console.log('❌ No obvious API endpoints found in scripts');
    }
    
    return Array.from(foundApis);
}

// Function to monitor for any new network requests
function monitorNetworkRequests() {
    console.log('🔍 Setting up network monitoring...');
    
    // Override fetch to catch API calls
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        console.log('🌐 FETCH REQUEST:', args[0], args[1]);
        return originalFetch.apply(this, arguments);
    };
    
    // Override XMLHttpRequest
    const originalXHR = window.XMLHttpRequest;
    window.XMLHttpRequest = function() {
        const xhr = new originalXHR();
        const originalOpen = xhr.open;
        
        xhr.open = function(method, url, ...rest) {
            console.log(`🌐 XHR REQUEST: ${method} ${url}`);
            return originalOpen.apply(this, [method, url, ...rest]);
        };
        
        return xhr;
    };
    
    // Override jQuery ajax if available
    if (window.$ && window.$.ajax) {
        const originalAjax = window.$.ajax;
        window.$.ajax = function(options) {
            console.log('🌐 JQUERY AJAX REQUEST:', options);
            return originalAjax.apply(this, arguments);
        };
    }
    
    console.log('✅ Network monitoring active - try placing an order now');
}

// Function to check form submissions
function monitorFormSubmissions() {
    console.log('📝 Monitoring form submissions...');
    
    const forms = document.querySelectorAll('form');
    forms.forEach((form, index) => {
        console.log(`📋 Form ${index + 1}: action="${form.action}" method="${form.method}"`);
        
        form.addEventListener('submit', function(event) {
            console.log(`🚀 FORM SUBMITTED:`, {
                action: form.action,
                method: form.method,
                data: new FormData(form)
            });
        });
    });
}

// Run all analyses
const apis = findApiCalls();
monitorNetworkRequests();
monitorFormSubmissions();

console.log('\n💡 NEXT STEPS:');
console.log('1. Try placing an order now - network requests will be logged');
console.log('2. Check console for any API calls that get intercepted');
console.log('3. Look for form submissions or AJAX requests');

// Make functions available for manual use
window.findApiCalls = findApiCalls;
window.monitorNetworkRequests = monitorNetworkRequests;
/**
 * Script to help discover real tablet.menu.ca credentials
 * Based on reverse engineering findings from memory bank
 */

const fs = require('fs');
const path = require('path');

/**
 * Search for credential patterns in files
 */
function searchCredentialPatterns(directory) {
  console.log('🔍 Searching for tablet.menu.ca credential patterns...');
  
  const patterns = [
    /rt_key['":\s]*['"]\w+['"]/gi,
    /rt_designator['":\s]*['"]\w+['"]/gi,
    /rt_api_version['":\s]*['"]\d+['"]/gi,
    /689a3cd4216f2/gi, // Example key from memory bank
    /O33/gi,           // Example designator from memory bank
    /tablet\.menu\.ca/gi
  ];
  
  const results = [];
  
  try {
    const files = fs.readdirSync(directory);
    
    for (const file of files) {
      if (file.endsWith('.js') || file.endsWith('.json') || file.endsWith('.md')) {
        const filePath = path.join(directory, file);
        
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          
          for (const pattern of patterns) {
            const matches = content.match(pattern);
            if (matches) {
              results.push({
                file: file,
                pattern: pattern.toString(),
                matches: matches
              });
            }
          }
        } catch (err) {
          // Skip files that can't be read
        }
      }
    }
  } catch (err) {
    console.log('❌ Error reading directory:', err.message);
  }
  
  return results;
}

/**
 * Look for potential credential files
 */
function findCredentialFiles() {
  console.log('📁 Looking for potential credential files...');
  
  const possibleFiles = [
    'tablet-credentials.json',
    'restaurant-keys.json', 
    'api-keys.json',
    'config.json',
    '.env',
    'credentials.txt',
    'keys.txt'
  ];
  
  const found = [];
  const currentDir = process.cwd();
  
  for (const file of possibleFiles) {
    const filePath = path.join(currentDir, file);
    if (fs.existsSync(filePath)) {
      found.push(filePath);
    }
  }
  
  return found;
}

/**
 * Extract credentials from APK decompilation results
 */
function searchAPKDecompilation() {
  console.log('📱 Searching APK decompilation results...');
  
  const apkDirs = [
    'menuca-decompiled',
    'menuca-restotool-decompiled', 
    'real-tablet-app-decompiled'
  ];
  
  const credentials = [];
  
  for (const dir of apkDirs) {
    if (fs.existsSync(dir)) {
      console.log(`📂 Found APK decompilation directory: ${dir}`);
      const results = searchCredentialPatterns(dir);
      credentials.push(...results);
    }
  }
  
  return credentials;
}

/**
 * Main discovery function
 */
function main() {
  console.log('🔐 MenuCA Tablet Credential Discovery Tool');
  console.log('==========================================\n');
  
  // Step 1: Search current directory for credential patterns
  const currentDirResults = searchCredentialPatterns('.');
  if (currentDirResults.length > 0) {
    console.log('✅ Found credential patterns in current directory:');
    currentDirResults.forEach(result => {
      console.log(`  📄 ${result.file}: ${result.matches.join(', ')}`);
    });
    console.log('');
  }
  
  // Step 2: Look for credential files
  const credentialFiles = findCredentialFiles();
  if (credentialFiles.length > 0) {
    console.log('✅ Found potential credential files:');
    credentialFiles.forEach(file => {
      console.log(`  📄 ${file}`);
    });
    console.log('');
  }
  
  // Step 3: Search APK decompilation results
  const apkResults = searchAPKDecompilation();
  if (apkResults.length > 0) {
    console.log('✅ Found credentials in APK decompilation:');
    apkResults.forEach(result => {
      console.log(`  📱 ${result.file}: ${result.matches.join(', ')}`);
    });
    console.log('');
  }
  
  // Step 4: Provide next steps
  console.log('🎯 Next Steps:');
  console.log('1. Check restaurant tablet app settings for rt_key');
  console.log('2. Look at existing successful API calls in browser network tab');
  console.log('3. Contact restaurant to obtain API credentials');
  console.log('4. Check if tablet app stores credentials locally');
  
  // Step 5: Generate test URLs to try
  console.log('\n🌐 Test URLs to try:');
  console.log('- https://tablet.menu.ca/get_orders.php');
  console.log('- https://tablet.menu.ca/action.php');
  console.log('- Check browser developer tools for actual API calls');
  
  return {
    currentDirResults,
    credentialFiles,
    apkResults
  };
}

// Run discovery
if (require.main === module) {
  const results = main();
  
  // If no results, provide troubleshooting tips
  if (results.currentDirResults.length === 0 && 
      results.credentialFiles.length === 0 && 
      results.apkResults.length === 0) {
    
    console.log('\n🔧 Troubleshooting:');
    console.log('- Make sure you have APK decompilation results in the directory');
    console.log('- Check if restaurant provides API documentation');
    console.log('- Examine working tablet app for stored credentials');
    console.log('- Look at successful network requests in browser dev tools');
  }
}

module.exports = {
  searchCredentialPatterns,
  findCredentialFiles,
  searchAPKDecompilation
};
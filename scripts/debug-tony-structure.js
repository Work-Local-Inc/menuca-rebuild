/**
 * Debug script to examine Tony's Pizza HTML structure
 */

const axios = require('axios');
const cheerio = require('cheerio');

async function debugTonyStructure() {
  try {
    const response = await axios.get('https://order.tonys-pizza.ca/?p=menu', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    
    console.log('🔍 Analyzing Tony\'s Pizza HTML structure...\n');
    
    // Look for table structures
    console.log('📊 Table structure:');
    $('table').each((i, table) => {
      const $table = $(table);
      console.log(`Table ${i + 1}:`);
      
      $table.find('tr').each((j, row) => {
        const $row = $(row);
        const text = $row.text().trim();
        const cellCount = $row.find('td').length;
        
        if (text && cellCount > 0) {
          console.log(`  Row ${j + 1} (${cellCount} cells): ${text.substring(0, 100)}...`);
        }
      });
      console.log('');
    });
    
    // Look for price patterns
    console.log('💰 Elements with prices:');
    $('*').each((i, element) => {
      const $el = $(element);
      const text = $el.text();
      
      if (/\$\d+\.\d{2}/.test(text)) {
        console.log(`${$el.prop('tagName')}: ${text.substring(0, 150)}`);
      }
    });
    
    // Look for potential categories
    console.log('\n📂 Potential category headers:');
    $('h1, h2, h3, h4, b, strong, td[colspan], .category').each((i, element) => {
      const $el = $(element);
      const text = $el.text().trim();
      
      if (text && text.length > 0 && text.length < 100) {
        console.log(`${$el.prop('tagName')}${$el.attr('colspan') ? `[colspan=${$el.attr('colspan')}]` : ''}: ${text}`);
      }
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

debugTonyStructure();

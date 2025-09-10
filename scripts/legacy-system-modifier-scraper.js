#!/usr/bin/env node
// Universal scraper for legacy pizza system multi-step customization flow
// Works with all 100+ locations using the same backend system
// Usage: node scripts/legacy-system-modifier-scraper.js <url> --out=modifiers.json

const { chromium } = require('playwright')
const fs = require('fs')

function parsePrice(text) {
  const m = (text || '').replace(/,/g,'').match(/([+-]?\$?\s*\d+(?:\.\d{1,2})?)/)
  if (!m) return 0
  const n = parseFloat(m[1].replace(/\$/g,'').trim())
  return isNaN(n) ? 0 : n
}

async function scrapeUniversalModifiers(url, maxItems = 5) {
  const browser = await chromium.launch({ headless: false })
  const page = await browser.newPage()
  
  const captured = {
    url,
    scrapedAt: new Date().toISOString(),
    items: [],
    universalModifiers: {
      crustTypes: [],
      toppings: [],
      dips: [],
      wingsSauces: [],
      drinks: []
    }
  }

  try {
    console.log('Opening legacy system menu:', url)
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await page.waitForTimeout(3000)

    // Find pizza items to test customization flow
    console.log('Looking for pizza items...')
    
    // Look for table rows with pizza names and order links
    const pizzaRows = await page.locator('tr').filter({ hasText: /pizza/i }).all()
    console.log(`Found ${pizzaRows.length} potential pizza rows`)

    let itemsProcessed = 0
    
    for (let i = 0; i < Math.min(pizzaRows.length, maxItems); i++) {
      const row = pizzaRows[i]
      
      try {
        // Get the pizza name from this row
        const rowText = await row.textContent()
        const pizzaName = rowText.match(/([^$]+?)\s*\$/)?.[1]?.trim() || `Pizza ${i}`
        
        console.log(`\\nProcessing: ${pizzaName}`)
        
        // Find the order link in this row
        const orderLink = await row.locator('a[href="#"]').last()
        
        if (await orderLink.count() > 0) {
          console.log('Clicking order link...')
          await orderLink.click()
          await page.waitForTimeout(3000)
          
          // Now we should be in the multi-step customization flow
          const modifiers = await scrapeCustomizationSteps(page, pizzaName)
          
          if (modifiers.length > 0) {
            captured.items.push({
              name: pizzaName,
              modifiers: modifiers
            })
            
            // Collect universal modifiers
            for (const mod of modifiers) {
              if (mod.name.toLowerCase().includes('crust')) {
                captured.universalModifiers.crustTypes.push(...mod.options)
              } else if (mod.name.toLowerCase().includes('topping')) {
                captured.universalModifiers.toppings.push(...mod.options)
              } else if (mod.name.toLowerCase().includes('dip')) {
                captured.universalModifiers.dips.push(...mod.options)
              } else if (mod.name.toLowerCase().includes('sauce')) {
                captured.universalModifiers.wingsSauces.push(...mod.options)
              } else if (mod.name.toLowerCase().includes('drink') || mod.name.toLowerCase().includes('pop')) {
                captured.universalModifiers.drinks.push(...mod.options)
              }
            }
          }
          
          itemsProcessed++
          console.log(`Processed ${itemsProcessed}/${maxItems} items`)
          
          // Try to get back to menu (might need to clear cart or navigate back)
          try {
            await page.goBack()
            await page.waitForTimeout(2000)
          } catch {
            // If goBack fails, reload the menu page
            await page.goto(url, { waitUntil: 'domcontentloaded' })
            await page.waitForTimeout(3000)
          }
          
        } else {
          console.log('No order link found in row')
        }
        
      } catch (error) {
        console.log(`Error processing row ${i}:`, error.message)
        continue
      }
    }
    
  } catch (error) {
    console.error('Main error:', error.message)
  } finally {
    await browser.close()
  }
  
  // Deduplicate universal modifiers
  const dedupeOptions = (options) => {
    const seen = new Set()
    return options.filter(opt => {
      const key = `${opt.name}-${opt.price}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }
  
  captured.universalModifiers.crustTypes = dedupeOptions(captured.universalModifiers.crustTypes)
  captured.universalModifiers.toppings = dedupeOptions(captured.universalModifiers.toppings)
  captured.universalModifiers.dips = dedupeOptions(captured.universalModifiers.dips)
  captured.universalModifiers.wingsSauces = dedupeOptions(captured.universalModifiers.wingsSauces)
  captured.universalModifiers.drinks = dedupeOptions(captured.universalModifiers.drinks)
  
  return captured
}

async function scrapeCustomizationSteps(page, itemName) {
  const modifiers = []
  let stepCount = 0
  const maxSteps = 10 // Prevent infinite loops
  
  console.log('Scraping customization steps...')
  
  while (stepCount < maxSteps) {
    stepCount++
    await page.waitForTimeout(2000)
    
    // Check if we're in a customization step
    const bodyText = await page.textContent('body')
    const pageTitle = await page.title()
    
    console.log(`Step ${stepCount}: ${pageTitle}`)
    
    // Look for modifier groups on this step
    const currentModifiers = await extractModifiersFromPage(page)
    
    if (currentModifiers.length > 0) {
      modifiers.push(...currentModifiers)
      console.log(`Found ${currentModifiers.length} modifier groups on this step`)
    }
    
    // Try to proceed to next step
    const nextButton = await page.locator('button, input[type="submit"], a').filter({ 
      hasText: /next|continue|proceed|add to cart|customize/i 
    }).first()
    
    if (await nextButton.count() > 0) {
      console.log('Clicking next/continue button...')
      await nextButton.click()
      await page.waitForTimeout(2000)
    } else {
      console.log('No next button found, customization complete')
      break
    }
    
    // Check if we've completed customization (reached cart or final step)
    const newBodyText = await page.textContent('body')
    if (newBodyText.toLowerCase().includes('cart') || 
        newBodyText.toLowerCase().includes('checkout') ||
        newBodyText.toLowerCase().includes('total')) {
      console.log('Reached cart/checkout, customization complete')
      break
    }
  }
  
  return modifiers
}

async function extractModifiersFromPage(page) {
  const modifiers = []
  
  try {
    const bodyText = await page.textContent('body')
    
    // Look for different types of modifier sections
    const sections = [
      { name: 'Crust', pattern: /crust/i },
      { name: 'Toppings', pattern: /topping/i },
      { name: 'Dips', pattern: /dip/i },
      { name: 'Sauces', pattern: /sauce/i },
      { name: 'Drinks', pattern: /drink|pop|beverage/i },
      { name: 'Wings Sauces', pattern: /wings.*sauce|sauce.*wings/i }
    ]
    
    for (const section of sections) {
      if (section.pattern.test(bodyText)) {
        console.log(`Found ${section.name} section`)
        
        // Extract options from this section
        const options = await extractOptionsFromSection(page, section.name)
        
        if (options.length > 0) {
          modifiers.push({
            name: section.name,
            options: options
          })
        }
      }
    }
    
    // Also look for radio buttons and checkboxes which indicate modifier options
    const radios = await page.locator('input[type="radio"]').all()
    const checkboxes = await page.locator('input[type="checkbox"]').all()
    
    if (radios.length > 0 || checkboxes.length > 0) {
      console.log(`Found ${radios.length} radios and ${checkboxes.length} checkboxes`)
      
      // Extract options from form elements
      const formOptions = []
      
      for (const input of [...radios, ...checkboxes]) {
        try {
          const label = await input.locator('xpath=following-sibling::label[1]').textContent().catch(() => '')
          const value = await input.getAttribute('value') || ''
          const name = label || value || 'Option'
          const price = parsePrice(name)
          
          if (name && name.length > 1) {
            formOptions.push({ name: name.replace(/\$[\d.]+/, '').trim(), price })
          }
        } catch {}
      }
      
      if (formOptions.length > 0) {
        modifiers.push({
          name: 'Options',
          options: formOptions
        })
      }
    }
    
  } catch (error) {
    console.log('Error extracting modifiers:', error.message)
  }
  
  return modifiers
}

async function extractOptionsFromSection(page, sectionName) {
  const options = []
  
  try {
    // Look for price patterns in the page text
    const bodyText = await page.textContent('body')
    const lines = bodyText.split('\\n')
    
    // Find lines that look like modifier options (contain $ and reasonable names)
    const optionLines = lines.filter(line => {
      const l = line.trim()
      return l.includes('$') && 
             l.length < 100 && 
             l.length > 3 &&
             !l.includes('Small') && // Exclude size options
             !l.includes('Medium') &&
             !l.includes('Large') &&
             !l.includes('X-Large')
    })
    
    for (const line of optionLines) {
      const name = line.replace(/\$[\d.]+/, '').trim()
      const price = parsePrice(line)
      
      if (name && name.length > 1 && name.length < 50) {
        options.push({ name, price })
      }
    }
    
  } catch (error) {
    console.log('Error extracting section options:', error.message)
  }
  
  return options
}

// Main execution
async function main() {
  const args = process.argv.slice(2)
  const url = args[0]
  const maxItems = parseInt(args.find(arg => arg.startsWith('--max='))?.split('=')[1] || '5')
  const outputFile = args.find(arg => arg.startsWith('--out='))?.split('=')[1] || 'legacy-modifiers.json'
  
  if (!url) {
    console.error('Usage: node scripts/legacy-system-modifier-scraper.js <url> [--max=5] [--out=modifiers.json]')
    process.exit(1)
  }
  
  const result = await scrapeUniversalModifiers(url, maxItems)
  
  fs.writeFileSync(outputFile, JSON.stringify(result, null, 2))
  console.log(`\\nSaved results to ${outputFile}`)
  console.log(`Captured ${result.items.length} items with modifiers`)
  console.log('Universal modifiers found:')
  console.log(`  Crust types: ${result.universalModifiers.crustTypes.length}`)
  console.log(`  Toppings: ${result.universalModifiers.toppings.length}`)
  console.log(`  Dips: ${result.universalModifiers.dips.length}`)
  console.log(`  Wings sauces: ${result.universalModifiers.wingsSauces.length}`)
  console.log(`  Drinks: ${result.universalModifiers.drinks.length}`)
}

if (require.main === module) {
  main().catch(err => {
    console.error(err)
    process.exit(1)
  })
}

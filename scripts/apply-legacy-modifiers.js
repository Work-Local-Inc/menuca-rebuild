#!/usr/bin/env node
// Apply the real legacy system modifier options to a restaurant
// This replaces the broken modifier groups with the actual ones from the legacy system

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function applyLegacyModifiers(tenantId) {
  console.log(`Applying legacy system modifiers to tenant: ${tenantId}`)
  
  // Load the real modifier data
  const modifierData = JSON.parse(fs.readFileSync('./scripts/legacy-system-modifiers-data.json', 'utf8'))
  const { universalModifiers } = modifierData
  
  try {
    // 1. Clear existing broken modifier groups and options
    console.log('Clearing existing modifier groups...')
    const { data: existingGroups } = await supabase
      .from('modifier_groups')
      .select('id')
      .eq('tenant_id', tenantId)
    
    if (existingGroups && existingGroups.length > 0) {
      const groupIds = existingGroups.map(g => g.id)
      
      // Delete existing options
      await supabase
        .from('modifier_options')
        .delete()
        .in('modifier_group_id', groupIds)
      
      // Delete existing item-group links
      await supabase
        .from('item_modifier_groups')
        .delete()
        .in('modifier_group_id', groupIds)
      
      // Delete existing groups
      await supabase
        .from('modifier_groups')
        .delete()
        .eq('tenant_id', tenantId)
    }
    
    // 2. Create the real modifier groups
    const groupMappings = [
      { name: 'Size', data: [], display_order: 0, min: 1, max: 1, required: true },
      { name: 'Crust type', data: universalModifiers.crustTypes, display_order: 1, min: 1, max: 1, required: true },
      { name: 'Toppings', data: universalModifiers.toppings, display_order: 2, min: 0, max: null, required: false },
      { name: 'Dips', data: universalModifiers.dips, display_order: 3, min: 0, max: null, required: false },
      { name: 'Drinks', data: universalModifiers.drinks, display_order: 4, min: 0, max: 1, required: false },
      { name: 'Wings Sauces', data: universalModifiers.wingsSauces, display_order: 5, min: 1, max: null, required: true }
    ]
    
    const createdGroups = {}
    
    for (const group of groupMappings) {
      if (group.name === 'Size' || group.data.length > 0) {
        console.log(`Creating ${group.name} group...`)
        
        // Create the modifier group
        const { data: newGroup, error: groupError } = await supabase
          .from('modifier_groups')
          .insert({
            tenant_id: tenantId,
            name: group.name,
            min_selection: group.min,
            max_selection: group.max,
            display_order: group.display_order,
            is_available: true
          })
          .select('id')
          .single()
        
        if (groupError) {
          console.error(`Error creating ${group.name} group:`, groupError)
          continue
        }
        
        const groupId = newGroup.id
        createdGroups[group.name] = groupId
        
        // Add Size options manually
        if (group.name === 'Size') {
          const sizeOptions = [
            { name: 'Small', price: 0.00 },
            { name: 'Medium', price: 6.00 },
            { name: 'Large', price: 12.00 },
            { name: 'X-Large', price: 18.00 }
          ]
          group.data = sizeOptions
        }
        
        // Create the modifier options
        for (let i = 0; i < group.data.length; i++) {
          const option = group.data[i]
          
          const { error: optionError } = await supabase
            .from('modifier_options')
            .insert({
              modifier_group_id: groupId,
              name: option.name,
              price_delta: option.price,
              display_order: i,
              is_available: true
            })
          
          if (optionError) {
            console.error(`Error creating option ${option.name}:`, optionError)
          }
        }
        
        console.log(`  Created ${group.data.length} options for ${group.name}`)
      }
    }
    
    // 3. Link modifier groups to appropriate items
    console.log('Linking modifier groups to items...')
    
    const { data: allItems } = await supabase
      .from('items')
      .select('id, base_name')
      .eq('tenant_id', tenantId)
    
    for (const item of allItems || []) {
      const itemName = (item.base_name || '').toLowerCase()
      
      // Link Size and Crust to all pizza items
      if (itemName.includes('pizza')) {
        if (createdGroups['Size']) {
          await supabase
            .from('item_modifier_groups')
            .insert({
              item_id: item.id,
              modifier_group_id: createdGroups['Size'],
              display_order: 0,
              required: true,
              min_selection: 1,
              max_selection: 1
            })
        }
        
        if (createdGroups['Crust type']) {
          await supabase
            .from('item_modifier_groups')
            .insert({
              item_id: item.id,
              modifier_group_id: createdGroups['Crust type'],
              display_order: 1,
              required: true,
              min_selection: 1,
              max_selection: 1
            })
        }
        
        // Link Toppings to customizable pizzas (ones with "topping" in name)
        if (itemName.includes('topping') && createdGroups['Toppings']) {
          const maxToppings = itemName.includes('3 topping') ? 3 : null
          await supabase
            .from('item_modifier_groups')
            .insert({
              item_id: item.id,
              modifier_group_id: createdGroups['Toppings'],
              display_order: 2,
              required: false,
              min_selection: 0,
              max_selection: maxToppings
            })
        }
        
        // Link Dips to all pizzas
        if (createdGroups['Dips']) {
          await supabase
            .from('item_modifier_groups')
            .insert({
              item_id: item.id,
              modifier_group_id: createdGroups['Dips'],
              display_order: 3,
              required: false,
              min_selection: 0,
              max_selection: null
            })
        }
      }
      
      // Link Wings Sauces to wing items
      if (itemName.includes('wing') && createdGroups['Wings Sauces']) {
        await supabase
          .from('item_modifier_groups')
          .insert({
            item_id: item.id,
            modifier_group_id: createdGroups['Wings Sauces'],
            display_order: 5,
            required: true,
            min_selection: 1,
            max_selection: null
          })
      }
      
      // Link Drinks to combo items
      if ((itemName.includes('combo') || itemName.includes('deal') || itemName.includes('with')) && 
          createdGroups['Drinks']) {
        await supabase
          .from('item_modifier_groups')
          .insert({
            item_id: item.id,
            modifier_group_id: createdGroups['Drinks'],
            display_order: 4,
            required: false,
            min_selection: 0,
            max_selection: 4 // Based on Tony's "choose 4 pops"
          })
      }
    }
    
    console.log('Successfully applied legacy system modifiers!')
    console.log('Groups created:', Object.keys(createdGroups))
    
  } catch (error) {
    console.error('Error applying modifiers:', error)
  }
}

// Main execution
async function main() {
  const tenantId = process.argv[2]
  
  if (!tenantId) {
    console.error('Usage: node scripts/apply-legacy-modifiers.js <tenant_id>')
    console.error('Example: node scripts/apply-legacy-modifiers.js tony-s-pizza-1757514596537')
    process.exit(1)
  }
  
  await applyLegacyModifiers(tenantId)
}

if (require.main === module) {
  main().catch(err => {
    console.error(err)
    process.exit(1)
  })
}

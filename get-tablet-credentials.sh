#!/bin/bash

echo "🔍 FINDING YOUR TABLET A19 CREDENTIALS"
echo "======================================"
echo ""
echo "We need to get the rt_key for your tablet A19."
echo "Here are a few ways to find it:"
echo ""
echo "METHOD 1: Check tablet.menu.ca/app.php with A19 designator"
echo "========================================================="

# Try to get the app.php page but with A19 parameters
curl -s "https://tablet.menu.ca/app.php" -H "User-Agent: Mozilla/5.0 (Linux; Android 9; SM-T290)" | grep -E "(rt_key|rt_designator)" | head -5

echo ""
echo "METHOD 2: Try common tablet URL patterns for A19"
echo "================================================"

# Test if there are different URLs for different tablets
urls=(
  "https://tablet.menu.ca/app.php?designator=A19"
  "https://tablet.menu.ca/A19/app.php" 
  "https://A19.tablet.menu.ca/app.php"
  "https://tablet.menu.ca/app.php?restaurant=A19"
)

for url in "${urls[@]}"
do
  echo "Testing: $url"
  response=$(curl -s "$url" -H "User-Agent: Mozilla/5.0 (Linux; Android 9; SM-T290)" | grep -E "(rt_key|rt_designator|A19)" | head -2)
  if [ ! -z "$response" ]; then
    echo "  Found: $response"
  else
    echo "  No credentials found"
  fi
  echo ""
done

echo "METHOD 3: Manual tablet inspection"
echo "=================================="
echo "Since you have the tablet open:"
echo "1. Open developer tools in tablet browser (if possible)"
echo "2. Look at the page source of the MenuCA app"
echo "3. Search for 'rt_key' in the source"
echo "4. Should be near 'rt_designator = \"A19\"'"
echo ""
echo "OR:"
echo "1. In the MenuCA app, open browser dev console"
echo "2. Type: console.log('rt_key:', rt_key)"  
echo "3. Type: console.log('rt_designator:', rt_designator)"
echo ""
echo "What does your tablet show for rt_key?"
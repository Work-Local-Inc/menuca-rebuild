#!/bin/bash

echo "🔍 FINDING A19 TABLET CREDENTIALS"
echo "================================="
echo "Restaurant name: test James Dovercourt"
echo "Device ID: A19"
echo ""

echo "METHOD 1: Try different parameter combinations for A19"
echo "====================================================="

# Try various ways to get A19 credentials
test_urls=(
  "https://tablet.menu.ca/app.php?device_id=A19"
  "https://tablet.menu.ca/app.php?tablet_id=A19" 
  "https://tablet.menu.ca/app.php?id=A19"
  "https://tablet.menu.ca/app.php?designator=A19"
  "https://tablet.menu.ca/app.php?restaurant_id=A19"
)

for url in "${test_urls[@]}"
do
  echo "Testing: $url"
  response=$(curl -s "$url" -H "User-Agent: Mozilla/5.0 (Linux; Android 9; SM-T290)" | grep -A5 -B5 "A19\|rt_key\|rt_designator")
  if [[ "$response" == *"A19"* ]] || [[ "$response" == *"rt_key"* ]]; then
    echo "  🎯 FOUND SOMETHING!"
    echo "$response"
  else
    echo "  No A19 credentials"
  fi
  echo ""
done

echo "METHOD 2: Search for James or Dovercourt"
echo "========================================"

# Try searching for the restaurant name
search_terms=("james" "dovercourt" "test")

for term in "${search_terms[@]}"
do
  echo "Searching for: $term"
  response=$(curl -s "https://tablet.menu.ca/app.php?search=$term" -H "User-Agent: Mozilla/5.0" | grep -i -A3 -B3 "$term\|rt_key")
  if [ ! -z "$response" ]; then
    echo "  Found: $response"
  else
    echo "  No results for $term"
  fi
  echo ""
done

echo "METHOD 3: Try session-based approach"
echo "===================================="

# Maybe the tablet credentials are session-based
echo "Getting base page credentials..."
base_response=$(curl -s "https://tablet.menu.ca/app.php" -H "User-Agent: Mozilla/5.0 (Linux; Android 9; SM-T290)")

echo "Base designator: $(echo "$base_response" | grep -o 'rt_designator.*=.*"[^"]*"' | head -1)"
echo "Base rt_key: $(echo "$base_response" | grep -o 'rt_key.*=.*"[^"]*"' | head -1)"

echo ""
echo "METHOD 4: Direct API probe with A19"
echo "==================================="

# Test if we can use A19 directly in API calls
echo "Testing get_orders.php with A19 as key..."
response=$(curl -s "https://tablet.menu.ca/get_orders.php" \
  -X POST \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "key=A19&sw_ver=MenuCA-Test&api_ver=13" 2>/dev/null)

echo "Response using A19 as key: $response"

echo ""
echo "🤔 NEXT STEPS:"
echo "=============="
echo "If none of the above found A19 credentials, we need to:"
echo "1. Try using one of the working credentials we found (P41, Q71, R88, K60)"
echo "2. Or extract credentials from your actual tablet app"
echo ""
echo "Found working credentials so far:"
echo "- P41: 689a41bef18a4"
echo "- Q71: 689a54b146408" 
echo "- R88: 689a54b17a8ec"
echo "- K60: 689a54b21b804"
echo ""
echo "Let's try sending a test order to one of these and see if it shows up on your A19 tablet!"
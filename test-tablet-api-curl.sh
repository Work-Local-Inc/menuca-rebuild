#!/bin/bash

# Test Order Injection into Live tablet.menu.ca System
# Using curl for maximum compatibility

echo "🧪 MENUECA TABLET API INTEGRATION TESTING"
echo "=========================================="
echo "Target: https://tablet.menu.ca"
echo "Test Key: 689a41bef18a4"
echo "Restaurant: P41"
echo ""

# Live credentials discovered from tablet.menu.ca/app.php
RT_KEY="689a41bef18a4"
RT_DESIGNATOR="P41" 
RT_API_VERSION="13"
BASE_URL="https://tablet.menu.ca"

echo "🔍 TESTING API CONNECTIVITY"
echo "============================"

# Test each endpoint
ENDPOINTS=("/action.php" "/get_orders.php" "/get_history.php" "/update_config.php" "/diagnostics.php")

for endpoint in "${ENDPOINTS[@]}"
do
    echo "Testing $endpoint..."
    
    response=$(curl -s -w "HTTP_STATUS:%{http_code}" \
        -X POST \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -H "User-Agent: MenuCA-Integration-Test/1.0" \
        -d "key=$RT_KEY&test=connectivity" \
        "$BASE_URL$endpoint" 2>/dev/null)
    
    http_status=$(echo "$response" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
    body=$(echo "$response" | sed 's/HTTP_STATUS:[0-9]*$//')
    
    echo "  Status: $http_status"
    if [ ${#body} -gt 0 ]; then
        echo "  Response: ${body:0:100}$([ ${#body} -gt 100 ] && echo '...')"
    fi
    echo ""
done

echo ""
echo "🔑 TESTING AUTHENTICATION"
echo "========================="

echo "Testing /get_orders.php with discovered credentials..."

response=$(curl -s -w "HTTP_STATUS:%{http_code}" \
    -X POST \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -H "User-Agent: MenuCA-Integration-Test/1.0" \
    -d "key=$RT_KEY&sw_ver=MenuCA-Integration-1.0&api_ver=$RT_API_VERSION" \
    "$BASE_URL/get_orders.php" 2>/dev/null)

http_status=$(echo "$response" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
body=$(echo "$response" | sed 's/HTTP_STATUS:[0-9]*$//')

echo "Status: $http_status"
echo "Response Body:"
echo "$body"

# Try to analyze the response
if [[ "$body" == *"error"* ]]; then
    echo "❌ Authentication Error detected in response"
elif [[ "$body" == *"ok"* ]] || [[ "$body" == *"success"* ]]; then
    echo "✅ Authentication appears successful!"
elif [[ "$body" == *"{"* ]]; then
    echo "📊 JSON response received - analyzing..."
else
    echo "⚠️  Unexpected response format"
fi

echo ""
echo "🎯 TESTING ORDER INJECTION"
echo "=========================="

# Create test order data
TEST_ORDER_ID="TEST_ORDER_$(date +%s)"
TEST_ORDER='{
  "id": "'$TEST_ORDER_ID'",
  "customer": {
    "name": "MenuCA Integration Test", 
    "phone": "555-0123",
    "address": "123 Test Street, Test City, ON K1A 0A6"
  },
  "items": [
    {
      "id": "test_item_1",
      "name": "Test Pizza",
      "price": 15.99,
      "quantity": 1,
      "options": {}
    }
  ],
  "total": 15.99,
  "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")'"
}'

echo "📝 Test Order Data:"
echo "$TEST_ORDER" | jq . 2>/dev/null || echo "$TEST_ORDER"

echo ""
echo "Submitting order to /action.php..."

response=$(curl -s -w "HTTP_STATUS:%{http_code}" \
    -X POST \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -H "User-Agent: MenuCA-Integration-Test/1.0" \
    -d "key=$RT_KEY&action=submit&order=$TEST_ORDER&api_ver=$RT_API_VERSION" \
    "$BASE_URL/action.php" 2>/dev/null)

http_status=$(echo "$response" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
body=$(echo "$response" | sed 's/HTTP_STATUS:[0-9]*$//')

echo "📡 Order Injection Response: $http_status"
echo "Response Body:"
echo "$body"

# Analyze injection result
if [[ "$body" == *"success"* ]] || [[ "$body" == *"ok"* ]]; then
    echo ""
    echo "🎉 ORDER INJECTION SUCCESSFUL!"
    echo "Order should now appear on restaurant tablet!"
elif [[ "$body" == *"error"* ]]; then
    echo ""
    echo "❌ Order injection failed - error in response"
elif [[ "$body" == *"authentication"* ]] || [[ "$body" == *"unauthorized"* ]]; then
    echo ""
    echo "🔑 Authentication issue detected"
elif [[ "$body" == *"format"* ]] || [[ "$body" == *"invalid"* ]]; then
    echo ""
    echo "📝 Order format issue detected"
else
    echo ""
    echo "⚠️  Unclear response - manual analysis needed"
fi

echo ""
echo "🔄 TESTING DIFFERENT ACTION TYPES"
echo "=================================="

ACTION_TYPES=("test" "ping" "status" "submit" "create" "add")

for action in "${ACTION_TYPES[@]}"
do
    echo ""
    echo "Testing action: \"$action\""
    
    response=$(curl -s -w "HTTP_STATUS:%{http_code}" \
        -X POST \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -H "User-Agent: MenuCA-Integration-Test/1.0" \
        -d "key=$RT_KEY&action=$action&order=test_order_data&api_ver=$RT_API_VERSION" \
        "$BASE_URL/action.php" 2>/dev/null)
    
    http_status=$(echo "$response" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
    body=$(echo "$response" | sed 's/HTTP_STATUS:[0-9]*$//')
    
    echo "  $http_status: ${body:0:100}$([ ${#body} -gt 100 ] && echo '...')"
done

echo ""
echo "🏁 TESTING COMPLETE"
echo "==================="
echo "Review the results above to understand:"
echo "1. Which endpoints are accessible"
echo "2. Whether authentication credentials work"  
echo "3. What order format is expected"
echo "4. Which action types are supported"
echo ""
echo "Next steps based on results:"
echo "- If 200 OK responses: API is accessible"
echo "- If authentication works: Can proceed with order injection"
echo "- If order injection fails: Need to reverse engineer correct format"
echo "- If all tests fail: Need to obtain valid restaurant API credentials"
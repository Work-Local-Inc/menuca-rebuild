#!/bin/bash

echo "🎯 TESTING ORDER CREATION METHODS"
echo "=================================="

# Test credentials from tablet.menu.ca
RT_KEY="689a41bef18a4"
RT_DESIGNATOR="P41" 
RT_API_VERSION="13"

# Create detailed test order
ORDER_JSON='{
  "id": "WEB_ORDER_'$(date +%s)'",
  "restaurant_id": "'$RT_DESIGNATOR'",
  "delivery_type": 1,
  "customer": {
    "name": "MenuCA Web Test",
    "phone": "555-0123",
    "email": "test@menuca.com"
  },
  "address": {
    "name": "John Doe",
    "address1": "123 Test Street",
    "address2": "Unit 456", 
    "city": "Ottawa",
    "province": "ON",
    "postal_code": "K1A 0A6",
    "phone": "555-0123"
  },
  "order": [
    {
      "item": "Large Pepperoni Pizza",
      "type": "Pizza",
      "qty": 1,
      "price": 19.99,
      "special_instructions": "Extra cheese please"
    }
  ],
  "price": {
    "subtotal": 19.99,
    "tax": 2.60,
    "delivery": 3.00,
    "tip": 3.00,
    "total": 28.59
  },
  "payment_method": "Credit Card",
  "payment_status": true,
  "comment": "Test order from MenuCA web integration",
  "delivery_time": '$(date -d "+30 minutes" +%s)',
  "time_created": '$(date +%s)',
  "status": 0
}'

echo "📝 Testing Order JSON:"
echo "$ORDER_JSON" | head -10

echo ""
echo "🔄 METHOD 1: Try 'submit' action with full order JSON"
response=$(curl -s -w "HTTP_STATUS:%{http_code}" \
    -X POST \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -H "User-Agent: MenuCA-Web-Integration/1.0" \
    --data-urlencode "key=$RT_KEY" \
    --data-urlencode "action=submit" \
    --data-urlencode "order=$ORDER_JSON" \
    --data-urlencode "api_ver=$RT_API_VERSION" \
    "https://tablet.menu.ca/action.php")

http_status=$(echo "$response" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
body=$(echo "$response" | sed 's/HTTP_STATUS:[0-9]*$//')

echo "Status: $http_status"
echo "Response: ${body:0:200}$([ ${#body} -gt 200 ] && echo '...')"

echo ""
echo "🔄 METHOD 2: Try 'new' action"
response=$(curl -s -w "HTTP_STATUS:%{http_code}" \
    -X POST \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -H "User-Agent: MenuCA-Web-Integration/1.0" \
    --data-urlencode "key=$RT_KEY" \
    --data-urlencode "action=new" \
    --data-urlencode "order=$ORDER_JSON" \
    --data-urlencode "api_ver=$RT_API_VERSION" \
    "https://tablet.menu.ca/action.php")

http_status=$(echo "$response" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
body=$(echo "$response" | sed 's/HTTP_STATUS:[0-9]*$//')

echo "Status: $http_status"
echo "Response: ${body:0:200}$([ ${#body} -gt 200 ] && echo '...')"

echo ""
echo "🔄 METHOD 3: Try no 'action' parameter - direct order submission"
response=$(curl -s -w "HTTP_STATUS:%{http_code}" \
    -X POST \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -H "User-Agent: MenuCA-Web-Integration/1.0" \
    --data-urlencode "key=$RT_KEY" \
    --data-urlencode "order=$ORDER_JSON" \
    --data-urlencode "api_ver=$RT_API_VERSION" \
    "https://tablet.menu.ca/action.php")

http_status=$(echo "$response" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
body=$(echo "$response" | sed 's/HTTP_STATUS:[0-9]*$//')

echo "Status: $http_status"
echo "Response: ${body:0:200}$([ ${#body} -gt 200 ] && echo '...')"

echo ""
echo "🔄 METHOD 4: Try different endpoint - maybe there's an 'api.php'"
response=$(curl -s -w "HTTP_STATUS:%{http_code}" \
    -X POST \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -H "User-Agent: MenuCA-Web-Integration/1.0" \
    --data-urlencode "key=$RT_KEY" \
    --data-urlencode "action=create_order" \
    --data-urlencode "order=$ORDER_JSON" \
    --data-urlencode "api_ver=$RT_API_VERSION" \
    "https://tablet.menu.ca/api.php")

http_status=$(echo "$response" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
body=$(echo "$response" | sed 's/HTTP_STATUS:[0-9]*$//')

echo "Status: $http_status"
echo "Response: ${body:0:200}$([ ${#body} -gt 200 ] && echo '...')"

echo ""
echo "🔄 METHOD 5: Try 'place_order' action"
response=$(curl -s -w "HTTP_STATUS:%{http_code}" \
    -X POST \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -H "User-Agent: MenuCA-Web-Integration/1.0" \
    --data-urlencode "key=$RT_KEY" \
    --data-urlencode "action=place_order" \
    --data-urlencode "order=$ORDER_JSON" \
    --data-urlencode "restaurant_id=$RT_DESIGNATOR" \
    --data-urlencode "api_ver=$RT_API_VERSION" \
    "https://tablet.menu.ca/action.php")

http_status=$(echo "$response" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
body=$(echo "$response" | sed 's/HTTP_STATUS:[0-9]*$//')

echo "Status: $http_status"
echo "Response: ${body:0:200}$([ ${#body} -gt 200 ] && echo '...')"

echo ""
echo "📡 After attempting order creation, let's check if it appeared in the queue:"
response=$(curl -s "https://tablet.menu.ca/get_orders.php" \
    -X POST \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "key=$RT_KEY&sw_ver=MenuCA-Web-Test&api_ver=$RT_API_VERSION")

echo "Orders in queue:"
echo "$response"

if [[ "$response" != "{}" ]]; then
    echo ""
    echo "🎉 SUCCESS! Found orders in queue - order creation might have worked!"
else
    echo ""
    echo "⚠️  Still empty queue - need to find the correct endpoint"
fi

echo ""
echo "🔍 NEXT STEPS:"
echo "1. If any method shows different response than empty, investigate further"
echo "2. Try variations of successful methods" 
echo "3. Look for different domain/subdomain patterns"
echo "4. Check if orders appear when polling get_orders.php"
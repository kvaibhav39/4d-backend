#!/bin/bash

# Test script to compare categories vs products endpoints
BASE_URL="http://localhost:5001/api"
PORT=5001

echo "=== Testing Categories vs Products API ==="
echo "Make sure your server is running on port $PORT"
echo ""

# Check if server is running
if ! curl -s "http://localhost:$PORT/health" > /dev/null 2>&1; then
  echo "❌ Server is not running on port $PORT"
  echo "Please start your server with: npm run dev"
  exit 1
fi

echo "✅ Server is running"
echo ""

# Test Login
echo "1. Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@4dcholi.com","password":"admin123"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed. Response: $LOGIN_RESPONSE"
  echo "You may need to create a user first"
  exit 1
fi

echo "✅ Login successful. Token: ${TOKEN:0:30}..."
echo ""

# Test Products (known working)
echo "2. Testing Products GET..."
PRODUCTS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/products" \
  -H "Authorization: Bearer $TOKEN")
PRODUCTS_RESPONSE=$(curl -s -X GET "$BASE_URL/products" \
  -H "Authorization: Bearer $TOKEN")

echo "   Status Code: $PRODUCTS_STATUS"
if [ "$PRODUCTS_STATUS" = "200" ]; then
  echo "   ✅ Products endpoint works"
  echo "   Response preview: $(echo "$PRODUCTS_RESPONSE" | head -c 100)..."
else
  echo "   ❌ Products endpoint failed"
  echo "   Response: $PRODUCTS_RESPONSE"
fi
echo ""

# Test Categories (should work)
echo "3. Testing Categories GET..."
CATEGORIES_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/categories" \
  -H "Authorization: Bearer $TOKEN")
CATEGORIES_RESPONSE=$(curl -s -X GET "$BASE_URL/categories" \
  -H "Authorization: Bearer $TOKEN")

echo "   Status Code: $CATEGORIES_STATUS"
if [ "$CATEGORIES_STATUS" = "200" ]; then
  echo "   ✅ Categories endpoint works!"
  echo "   Response preview: $(echo "$CATEGORIES_RESPONSE" | head -c 100)..."
elif [ "$CATEGORIES_STATUS" = "404" ]; then
  echo "   ❌ Categories endpoint returns 404 (Route not found)"
  echo "   This means the route isn't being registered properly"
  echo "   Response: $CATEGORIES_RESPONSE"
elif [ "$CATEGORIES_STATUS" = "401" ]; then
  echo "   ⚠️  Categories endpoint returns 401 (Unauthorized)"
  echo "   Check if auth middleware is working"
  echo "   Response: $CATEGORIES_RESPONSE"
elif [ "$CATEGORIES_STATUS" = "400" ]; then
  echo "   ⚠️  Categories endpoint returns 400 (Validation error)"
  echo "   Response: $CATEGORIES_RESPONSE"
else
  echo "   ❌ Categories endpoint failed with status $CATEGORIES_STATUS"
  echo "   Response: $CATEGORIES_RESPONSE"
fi
echo ""

# Test Categories with query params
echo "4. Testing Categories GET with search query..."
CATEGORIES_SEARCH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/categories?search=test" \
  -H "Authorization: Bearer $TOKEN")
echo "   Status Code: $CATEGORIES_SEARCH_STATUS"
echo ""

echo "=== Test Complete ==="


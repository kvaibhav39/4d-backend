#!/bin/bash

BASE_URL="http://localhost:5001/api"
TOKEN=""

echo "=== Testing 4D Choli API ==="
echo ""

# Test Health Endpoint
echo "1. Testing Health Endpoint..."
HEALTH=$(curl -s http://localhost:5001/health)
echo "Response: $HEALTH"
echo ""

# Test Login
echo "2. Testing Login Endpoint..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@4dcholi.com","password":"admin123"}')
echo "Response: $LOGIN_RESPONSE"
echo ""

# Extract token if login successful
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
if [ -z "$TOKEN" ]; then
  echo "⚠️  Login failed - need to create user first. Testing other endpoints with auth will fail."
  echo ""
else
  echo "✅ Got token: ${TOKEN:0:20}..."
  echo ""
fi

# Test Get Current User (requires auth)
if [ ! -z "$TOKEN" ]; then
  echo "3. Testing Get Current User..."
  USER_RESPONSE=$(curl -s -X GET "$BASE_URL/auth/me" \
    -H "Authorization: Bearer $TOKEN")
  echo "Response: $USER_RESPONSE"
  echo ""
fi

# Test Products List (requires auth)
echo "4. Testing Products List..."
PRODUCTS_RESPONSE=$(curl -s -X GET "$BASE_URL/products" \
  -H "Authorization: Bearer $TOKEN")
echo "Response: $PRODUCTS_RESPONSE"
echo ""

# Test Bookings List (requires auth)
echo "5. Testing Bookings List..."
BOOKINGS_RESPONSE=$(curl -s -X GET "$BASE_URL/bookings" \
  -H "Authorization: Bearer $TOKEN")
echo "Response: $BOOKINGS_RESPONSE"
echo ""

# Test Dashboard Stats (requires auth)
echo "6. Testing Dashboard Stats..."
STATS_RESPONSE=$(curl -s -X GET "$BASE_URL/dashboard/stats?date=$(date +%Y-%m-%d)" \
  -H "Authorization: Bearer $TOKEN")
echo "Response: $STATS_RESPONSE"
echo ""

# Test Dashboard Bookings (requires auth)
echo "7. Testing Dashboard Bookings..."
DASHBOARD_BOOKINGS=$(curl -s -X GET "$BASE_URL/dashboard/bookings?date=$(date +%Y-%m-%d)" \
  -H "Authorization: Bearer $TOKEN")
echo "Response: $DASHBOARD_BOOKINGS"
echo ""

echo "=== API Testing Complete ==="

